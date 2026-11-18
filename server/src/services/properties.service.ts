import fs from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "../middleware/upload";
import { prisma } from "../db";
import { AppError } from "../utils/errors";
import type { PropertyInput, PropertyUpdateInput } from "../schemas/property.schema";

const toNumber = (value: unknown) => (value === null || value === undefined ? null : Number(value));

// короткий вигляд для списку
function toListItem(p: any) {
  const activeLease = p.leases && p.leases.length > 0 ? p.leases[0] : null;

  return {
    id: p.id,
    title: p.title,
    type: p.type,
    status: p.status,
    city: p.city,
    address: p.address,
    area: toNumber(p.area),
    rooms: p.rooms,
    floor: p.floor,
    description: p.description,
    baseRent: Number(p.baseRent),
    purchasePrice: toNumber(p.purchasePrice),
    coverUrl: p.photos && p.photos.length > 0 ? p.photos[0].url : null,
    tenant: activeLease ? `${activeLease.tenant.firstName} ${activeLease.tenant.lastName}` : null,
    rent: activeLease ? Number(activeLease.rentAmount) : null,
  };
}

// знаходить об'єкт і перевіряє, що він належить цьому власнику
async function findOwned(ownerId: string, id: string) {
  const property = await prisma.property.findFirst({ where: { id, ownerId } });
  if (!property) {
    throw new AppError(404, "Об'єкт не знайдено");
  }
  return property;
}

export async function list(ownerId: string, filters: { status?: string; search?: string }) {
  const where: any = { ownerId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { address: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const properties = await prisma.property.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      photos: { orderBy: { isCover: "desc" }, take: 1 },
      leases: { where: { status: "ACTIVE" }, include: { tenant: true }, take: 1 },
    },
  });

  return properties.map(toListItem);
}

export async function getById(ownerId: string, id: string) {
  await findOwned(ownerId, id);

  const p = await prisma.property.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { isCover: "desc" } },
      leases: { orderBy: { startDate: "desc" }, include: { tenant: true } },
    },
  });

  if (!p) {
    throw new AppError(404, "Об'єкт не знайдено");
  }

  return {
    id: p.id,
    title: p.title,
    type: p.type,
    status: p.status,
    city: p.city,
    address: p.address,
    area: toNumber(p.area),
    rooms: p.rooms,
    floor: p.floor,
    description: p.description,
    baseRent: Number(p.baseRent),
    purchasePrice: toNumber(p.purchasePrice),
    photos: p.photos.map((ph) => ({ id: ph.id, url: ph.url, isCover: ph.isCover })),
    leases: p.leases.map((l) => ({
      id: l.id,
      number: l.number,
      status: l.status,
      startDate: l.startDate,
      endDate: l.endDate,
      rentAmount: Number(l.rentAmount),
      tenant: `${l.tenant.firstName} ${l.tenant.lastName}`,
    })),
  };
}

export async function create(ownerId: string, data: PropertyInput) {
  const property = await prisma.property.create({
    data: { ...data, ownerId },
  });
  return getById(ownerId, property.id);
}

export async function update(ownerId: string, id: string, data: PropertyUpdateInput) {
  await findOwned(ownerId, id);
  await prisma.property.update({ where: { id }, data });
  return getById(ownerId, id);
}

export async function remove(ownerId: string, id: string) {
  await findOwned(ownerId, id);

  const leasesCount = await prisma.lease.count({ where: { propertyId: id } });
  if (leasesCount > 0) {
    throw new AppError(409, "Не можна видалити об'єкт, у якого є договори. Змініть його статус.");
  }

  await prisma.property.delete({ where: { id } });
}

export async function addPhotos(ownerId: string, id: string, files: Express.Multer.File[]) {
  await findOwned(ownerId, id);

  if (files.length === 0) {
    throw new AppError(400, "Не вибрано жодного файлу");
  }

  // перше фото об'єкта автоматично стає обкладинкою
  const existing = await prisma.propertyPhoto.count({ where: { propertyId: id } });

  await prisma.propertyPhoto.createMany({
    data: files.map((file, index) => ({
      propertyId: id,
      url: `/uploads/${file.filename}`,
      isCover: existing === 0 && index === 0,
    })),
  });

  return getById(ownerId, id);
}

async function findPhoto(ownerId: string, id: string, photoId: string) {
  await findOwned(ownerId, id);

  const photo = await prisma.propertyPhoto.findFirst({ where: { id: photoId, propertyId: id } });
  if (!photo) {
    throw new AppError(404, "Фото не знайдено");
  }
  return photo;
}

export async function deletePhoto(ownerId: string, id: string, photoId: string) {
  const photo = await findPhoto(ownerId, id, photoId);

  await prisma.propertyPhoto.delete({ where: { id: photoId } });

  // видаляємо файл з диска (фото із seed лежать в інтернеті, їх пропускаємо)
  if (photo.url.startsWith("/uploads/")) {
    await fs.unlink(path.join(UPLOAD_DIR, path.basename(photo.url))).catch(() => {});
  }

  // якщо видалили обкладинку, призначаємо нову
  if (photo.isCover) {
    const next = await prisma.propertyPhoto.findFirst({
      where: { propertyId: id },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.propertyPhoto.update({ where: { id: next.id }, data: { isCover: true } });
    }
  }

  return getById(ownerId, id);
}

export async function setCover(ownerId: string, id: string, photoId: string) {
  await findPhoto(ownerId, id, photoId);

  await prisma.$transaction([
    prisma.propertyPhoto.updateMany({ where: { propertyId: id }, data: { isCover: false } }),
    prisma.propertyPhoto.update({ where: { id: photoId }, data: { isCover: true } }),
  ]);

  return getById(ownerId, id);
}