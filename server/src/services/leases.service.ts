import { prisma } from "../db";
import { AppError } from "../utils/errors";
import type { LeaseInput, LeaseUpdateInput } from "../schemas/lease.schema";

const include = {
  property: true,
  tenant: true,
  documents: true,
};

function toItem(l: any) {
  return {
    id: l.id,
    number: l.number,
    status: l.status,
    startDate: l.startDate,
    endDate: l.endDate,
    rentAmount: Number(l.rentAmount),
    depositAmount: Number(l.depositAmount),
    paymentDay: l.paymentDay,
    penaltyRatePerDay: Number(l.penaltyRatePerDay),
    indexationPercent: Number(l.indexationPercent),
    autoRenew: l.autoRenew,
    notes: l.notes,
    terminatedAt: l.terminatedAt,
    terminationReason: l.terminationReason,
    property: { id: l.property.id, title: l.property.title, address: l.property.address },
    tenant: { id: l.tenant.id, name: `${l.tenant.firstName} ${l.tenant.lastName}` },
    documents: (l.documents ?? []).map((d: any) => ({ id: d.id, name: d.name, type: d.type, url: d.url })),
  };
}

// знаходить договір і перевіряє, що об'єкт належить цьому власнику
async function findOwned(ownerId: string, id: string) {
  const lease = await prisma.lease.findFirst({
    where: { id, property: { ownerId } },
    include,
  });
  if (!lease) {
    throw new AppError(404, "Договір не знайдено");
  }
  return lease;
}

async function assertPropertyAndTenant(ownerId: string, propertyId: string, tenantId: string) {
  const property = await prisma.property.findFirst({ where: { id: propertyId, ownerId } });
  if (!property) {
    throw new AppError(404, "Об'єкт не знайдено");
  }

  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, ownerId } });
  if (!tenant) {
    throw new AppError(404, "Орендаря не знайдено");
  }
}

function assertDates(start: Date, end: Date) {
  if (end <= start) {
    throw new AppError(400, "Дата закінчення має бути пізніше за дату початку");
  }
}

// на один об'єкт не може бути двох договорів на пересічні дати
async function assertNoOverlap(propertyId: string, start: Date, end: Date, excludeId?: string) {
  const clash = await prisma.lease.findFirst({
    where: {
      propertyId,
      status: { in: ["DRAFT", "ACTIVE"] },
      startDate: { lte: end },
      endDate: { gte: start },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  if (clash) {
    throw new AppError(409, `Для цього об'єкта вже є договір ${clash.number} на ці дати`);
  }
}

async function nextNumber() {
  const prefix = `L-${new Date().getFullYear()}-`;

  const last = await prisma.lease.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
  });

  let next = 1;
  if (last) {
    next = Number(last.number.slice(prefix.length)) + 1;
  }

  return prefix + String(next).padStart(3, "0");
}

// після завершення договору звільняємо об'єкт, якщо інших дійсних договорів немає
async function releasePropertyIfFree(propertyId: string) {
  const otherActive = await prisma.lease.count({ where: { propertyId, status: "ACTIVE" } });
  if (otherActive > 0) {
    return;
  }

  await prisma.property.updateMany({
    where: { id: propertyId, status: "RENTED" },
    data: { status: "VACANT" },
  });
}

export async function list(ownerId: string, filters: { status?: string; search?: string }) {
  const where: any = { property: { ownerId } };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.OR = [
      { number: { contains: filters.search, mode: "insensitive" } },
      { property: { title: { contains: filters.search, mode: "insensitive" } } },
      { tenant: { firstName: { contains: filters.search, mode: "insensitive" } } },
      { tenant: { lastName: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const leases = await prisma.lease.findMany({
    where,
    orderBy: { startDate: "desc" },
    include,
  });

  return leases.map(toItem);
}

export async function getById(ownerId: string, id: string) {
  return toItem(await findOwned(ownerId, id));
}

export async function create(ownerId: string, data: LeaseInput) {
  await assertPropertyAndTenant(ownerId, data.propertyId, data.tenantId);
  assertDates(data.startDate, data.endDate);
  await assertNoOverlap(data.propertyId, data.startDate, data.endDate);

  const lease = await prisma.lease.create({
    data: { ...data, number: await nextNumber(), status: "DRAFT" },
    include,
  });

  return toItem(lease);
}

export async function update(ownerId: string, id: string, data: LeaseUpdateInput) {
  const lease = await findOwned(ownerId, id);

  if (lease.status !== "DRAFT") {
    throw new AppError(409, "Редагувати можна лише чернетку договору");
  }

  const propertyId = data.propertyId ?? lease.propertyId;
  const tenantId = data.tenantId ?? lease.tenantId;
  const startDate = data.startDate ?? lease.startDate;
  const endDate = data.endDate ?? lease.endDate;

  await assertPropertyAndTenant(ownerId, propertyId, tenantId);
  assertDates(startDate, endDate);
  await assertNoOverlap(propertyId, startDate, endDate, id);

  const updated = await prisma.lease.update({ where: { id }, data, include });
  return toItem(updated);
}

export async function remove(ownerId: string, id: string) {
  const lease = await findOwned(ownerId, id);

  if (lease.status !== "DRAFT") {
    throw new AppError(409, "Видалити можна лише чернетку. Дійсний договір можна розірвати.");
  }

  await prisma.lease.delete({ where: { id } });
}

export async function activate(ownerId: string, id: string) {
  const lease = await findOwned(ownerId, id);

  if (lease.status !== "DRAFT") {
    throw new AppError(409, "Активувати можна лише чернетку");
  }

  const hasActive = await prisma.lease.count({
    where: { propertyId: lease.propertyId, status: "ACTIVE" },
  });
  if (hasActive > 0) {
    throw new AppError(409, "Для цього об'єкта вже є дійсний договір");
  }

  await prisma.$transaction([
    prisma.lease.update({ where: { id }, data: { status: "ACTIVE" } }),
    prisma.property.update({ where: { id: lease.propertyId }, data: { status: "RENTED" } }),
  ]);

  return getById(ownerId, id);
}

export async function terminate(ownerId: string, id: string, reason: string) {
  const lease = await findOwned(ownerId, id);

  if (lease.status !== "ACTIVE") {
    throw new AppError(409, "Розірвати можна лише дійсний договір");
  }

  await prisma.lease.update({
    where: { id },
    data: { status: "TERMINATED", terminatedAt: new Date(), terminationReason: reason },
  });

  await releasePropertyIfFree(lease.propertyId);

  return getById(ownerId, id);
}

// продовження: подовжуємо термін і індексуємо оренду
export async function renew(ownerId: string, id: string, months: number) {
  const lease = await findOwned(ownerId, id);

  if (lease.status !== "ACTIVE") {
    throw new AppError(409, "Продовжити можна лише дійсний договір");
  }

  const oldEnd = lease.endDate;
  const newEnd = new Date(
    Date.UTC(oldEnd.getUTCFullYear(), oldEnd.getUTCMonth() + months, oldEnd.getUTCDate())
  );

  // нові дати не повинні заходити на інший договір цього об'єкта
  const dayAfter = new Date(oldEnd.getTime() + 86400000);
  await assertNoOverlap(lease.propertyId, dayAfter, newEnd, id);

  const previousRent = Number(lease.rentAmount);
  const indexation = Number(lease.indexationPercent);
  const newRent = Math.round(previousRent * (1 + indexation / 100) * 100) / 100;

  await prisma.lease.update({
    where: { id },
    data: { endDate: newEnd, rentAmount: newRent },
  });

  return {
    lease: await getById(ownerId, id),
    previousRent,
    newRent,
    indexationPercent: indexation,
  };
}