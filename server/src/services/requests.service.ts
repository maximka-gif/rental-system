import { prisma } from "../db";
import { AppError } from "../utils/errors";

type Actor = { id: string; role: "OWNER" | "TENANT" | "ADMIN" };

const listInclude = {
  property: true,
  tenant: true,
  photos: { orderBy: { createdAt: "asc" as const }, take: 1 },
  _count: { select: { comments: true, photos: true } },
};

// дозволені переходи між статусами
const transitions: Record<string, string[]> = {
  NEW: ["IN_PROGRESS", "REJECTED"],
  IN_PROGRESS: ["DONE", "REJECTED"],
  DONE: [],
  REJECTED: [],
};

const statusNames: Record<string, string> = {
  NEW: "Нова",
  IN_PROGRESS: "У роботі",
  DONE: "Виконана",
  REJECTED: "Відхилена",
};

function toItem(r: any) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    priority: r.priority,
    status: r.status,
    cost: r.cost === null ? null : Number(r.cost),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    resolvedAt: r.resolvedAt,
    property: { id: r.property.id, title: r.property.title },
    tenant: r.tenant ? { id: r.tenant.id, name: `${r.tenant.firstName} ${r.tenant.lastName}` } : null,
    coverUrl: r.photos.length > 0 ? r.photos[0].url : null,
    photosCount: r._count.photos,
    commentsCount: r._count.comments,
  };
}

// кожен бачить лише свої заявки: власник по своїх об'єктах, орендар свої
function accessWhere(actor: Actor): any {
  if (actor.role === "OWNER") {
    return { property: { ownerId: actor.id } };
  }
  return { tenant: { userId: actor.id } };
}

async function findAccessible(actor: Actor, id: string) {
  const request = await prisma.maintenanceRequest.findFirst({
    where: { id, ...accessWhere(actor) },
  });
  if (!request) {
    throw new AppError(404, "Заявку не знайдено");
  }
  return request;
}

export async function list(
  actor: Actor,
  filters: { status?: string; propertyId?: string; search?: string }
) {
  const where: any = { ...accessWhere(actor) };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.propertyId) {
    where.propertyId = filters.propertyId;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { property: { title: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const requests = await prisma.maintenanceRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: listInclude,
  });

  return requests.map(toItem);
}

export async function getById(actor: Actor, id: string) {
  await findAccessible(actor, id);

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: {
      ...listInclude,
      photos: { orderBy: { createdAt: "asc" } },
      comments: { orderBy: { createdAt: "asc" }, include: { author: true } },
    },
  });

  if (!request) {
    throw new AppError(404, "Заявку не знайдено");
  }

  return {
    ...toItem(request),
    photos: request.photos.map((p) => ({ id: p.id, url: p.url })),
    comments: request.comments.map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt,
      author: {
        id: c.author.id,
        name: `${c.author.firstName} ${c.author.lastName}`,
        role: c.author.role,
      },
    })),
  };
}

export async function create(
  userId: string,
  data: { title: string; description: string; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" },
  files: Express.Multer.File[]
) {
  const tenant = await prisma.tenant.findUnique({ where: { userId } });
  if (!tenant) {
    throw new AppError(404, "Профіль орендаря не знайдено");
  }

  // заявка завжди стосується об'єкта з активного договору орендаря
  const lease = await prisma.lease.findFirst({
    where: { tenantId: tenant.id, status: "ACTIVE" },
  });
  if (!lease) {
    throw new AppError(409, "Подати заявку можна лише за дійсним договором оренди");
  }

  const request = await prisma.maintenanceRequest.create({
    data: {
      propertyId: lease.propertyId,
      tenantId: tenant.id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      photos: { create: files.map((file) => ({ url: `/uploads/${file.filename}` })) },
    },
  });

  return getById({ id: userId, role: "TENANT" }, request.id);
}

export async function addComment(actor: Actor, id: string, text: string) {
  await findAccessible(actor, id);

  await prisma.requestComment.create({
    data: { requestId: id, authorId: actor.id, text },
  });

  return getById(actor, id);
}

export async function changeStatus(ownerId: string, id: string, status: string, cost?: number) {
  const actor: Actor = { id: ownerId, role: "OWNER" };
  const request = await findAccessible(actor, id);

  if (!transitions[request.status].includes(status)) {
    throw new AppError(
      409,
      `Неможливо змінити статус «${statusNames[request.status]}» на «${statusNames[status]}»`
    );
  }

  const data: any = {
    status,
    resolvedAt: status === "IN_PROGRESS" ? null : new Date(),
  };

  if (status === "DONE" && cost !== undefined) {
    data.cost = cost;
  }

  const ops: any[] = [prisma.maintenanceRequest.update({ where: { id }, data })];

  // вартість ремонту автоматично потрапляє у витрати по об'єкту
  if (status === "DONE" && cost !== undefined && cost > 0) {
    ops.push(
      prisma.expense.create({
        data: {
          propertyId: request.propertyId,
          requestId: id,
          category: "REPAIR",
          amount: cost,
          date: new Date(),
          description: `Ремонт: ${request.title}`,
        },
      })
    );
  }

  await prisma.$transaction(ops);

  return getById(actor, id);
}