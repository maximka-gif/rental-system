import crypto from "crypto";
import { prisma } from "../db";
import { AppError } from "../utils/errors";
import type { TenantInput, TenantUpdateInput } from "../schemas/tenant.schema";

export const INVITE_DAYS = 14;

// знаходить орендаря й перевіряє, що він належить цьому власнику
async function findOwned(ownerId: string, id: string) {
  const tenant = await prisma.tenant.findFirst({ where: { id, ownerId } });
  if (!tenant) {
    throw new AppError(404, "Орендаря не знайдено");
  }
  return tenant;
}

function toListItem(t: any) {
  const leases: any[] = t.leases ?? [];
  const activeLease = leases.find((l) => l.status === "ACTIVE") ?? null;

  // статус акаунта: зареєстрований, запрошений або ще без акаунта
  let accountStatus: "REGISTERED" | "INVITED" | "NONE" = "NONE";
  if (t.userId) {
    accountStatus = "REGISTERED";
  } else if (t.inviteToken) {
    accountStatus = "INVITED";
  }

  return {
    id: t.id,
    firstName: t.firstName,
    lastName: t.lastName,
    email: t.email,
    phone: t.phone,
    documentNumber: t.documentNumber,
    birthDate: t.birthDate,
    notes: t.notes,
    reliabilityScore: t.reliabilityScore,
    accountStatus,
    property: activeLease ? activeLease.property.title : null,
  };
}

export async function list(ownerId: string, filters: { search?: string }) {
  const where: any = { ownerId };

  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const tenants = await prisma.tenant.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      leases: { where: { status: "ACTIVE" }, include: { property: true }, take: 1 },
    },
  });

  return tenants.map(toListItem);
}

export async function getById(ownerId: string, id: string) {
  await findOwned(ownerId, id);

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      leases: { orderBy: { startDate: "desc" }, include: { property: true } },
    },
  });

  if (!tenant) {
    throw new AppError(404, "Орендаря не знайдено");
  }

  return {
    ...toListItem(tenant),
    leases: tenant.leases.map((l) => ({
      id: l.id,
      number: l.number,
      status: l.status,
      startDate: l.startDate,
      endDate: l.endDate,
      rentAmount: Number(l.rentAmount),
      propertyId: l.propertyId,
      property: l.property.title,
    })),
  };
}

export async function create(ownerId: string, data: TenantInput) {
  const tenant = await prisma.tenant.create({
    data: { ...data, ownerId },
  });
  return getById(ownerId, tenant.id);
}

export async function update(ownerId: string, id: string, data: TenantUpdateInput) {
  await findOwned(ownerId, id);
  await prisma.tenant.update({ where: { id }, data });
  return getById(ownerId, id);
}

export async function remove(ownerId: string, id: string) {
  await findOwned(ownerId, id);

  const leasesCount = await prisma.lease.count({ where: { tenantId: id } });
  if (leasesCount > 0) {
    throw new AppError(409, "Не можна видалити орендаря, у якого є договори.");
  }

  await prisma.tenant.delete({ where: { id } });
}

// створює посилання-запрошення (діє 14 днів, нове посилання скасовує старе)
export async function createInvite(ownerId: string, id: string) {
  const tenant = await findOwned(ownerId, id);

  if (tenant.userId) {
    throw new AppError(409, "Орендар уже зареєстрований у системі");
  }

  const emailTaken = await prisma.user.findUnique({ where: { email: tenant.email } });
  if (emailTaken) {
    throw new AppError(409, "Користувач з таким email уже існує");
  }

  const token = crypto.randomBytes(24).toString("hex");
  const invitedAt = new Date();

  await prisma.tenant.update({
    where: { id },
    data: { inviteToken: token, invitedAt },
  });

  const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";

  return {
    token,
    link: `${clientUrl}/invite/${token}`,
    expiresAt: new Date(invitedAt.getTime() + INVITE_DAYS * 86400000),
  };
}