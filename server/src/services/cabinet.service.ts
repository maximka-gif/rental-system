import { prisma } from "../db";
import { AppError } from "../utils/errors";
import { round2 } from "../utils/date";
import { refreshInvoice } from "./invoices.service";

const num = (value: unknown) => Number(value);

async function getTenant(userId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { userId } });
  if (!tenant) {
    throw new AppError(404, "Профіль орендаря не знайдено");
  }
  return tenant;
}

// перед показом оновлюємо пеню на неоплачених рахунках, щоб суми були актуальні
async function refreshUnpaid(tenantId: string) {
  const unpaid = await prisma.invoice.findMany({
    where: { lease: { tenantId }, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
    select: { id: true },
  });

  for (const invoice of unpaid) {
    await refreshInvoice(invoice.id);
  }
}

function toInvoice(i: any) {
  const total = num(i.totalAmount);
  const paid = num(i.paidAmount);

  return {
    id: i.id,
    number: i.number,
    status: i.status,
    periodStart: i.periodStart,
    periodEnd: i.periodEnd,
    dueDate: i.dueDate,
    totalAmount: total,
    paidAmount: paid,
    debt: round2(Math.max(total - paid, 0)),
    property: { title: i.lease.property.title },
  };
}

export async function summary(userId: string) {
  const tenant = await getTenant(userId);
  await refreshUnpaid(tenant.id);

  const lease = await prisma.lease.findFirst({
    where: { tenantId: tenant.id, status: "ACTIVE" },
    include: { property: { include: { photos: { orderBy: { isCover: "desc" }, take: 1 } } } },
  });

  const unpaid = await prisma.invoice.findMany({
    where: { lease: { tenantId: tenant.id }, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
    orderBy: { dueDate: "asc" },
    include: { lease: { include: { property: true } } },
  });

  const invoices = unpaid.map(toInvoice);
  const debt = round2(invoices.reduce((sum, i) => sum + i.debt, 0));

  return {
    tenant: { firstName: tenant.firstName, lastName: tenant.lastName },
    lease: lease
      ? {
          id: lease.id,
          number: lease.number,
          startDate: lease.startDate,
          endDate: lease.endDate,
          rentAmount: num(lease.rentAmount),
          depositAmount: num(lease.depositAmount),
          paymentDay: lease.paymentDay,
          penaltyRatePerDay: num(lease.penaltyRatePerDay),
          indexationPercent: num(lease.indexationPercent),
          property: {
            title: lease.property.title,
            address: lease.property.address,
            city: lease.property.city,
            area: lease.property.area === null ? null : num(lease.property.area),
            rooms: lease.property.rooms,
            floor: lease.property.floor,
            coverUrl: lease.property.photos.length > 0 ? lease.property.photos[0].url : null,
          },
        }
      : null,
    debt,
    overdueCount: invoices.filter((i) => i.status === "OVERDUE").length,
    nextInvoice: invoices.length > 0 ? invoices[0] : null,
  };
}

export async function listInvoices(userId: string) {
  const tenant = await getTenant(userId);
  await refreshUnpaid(tenant.id);

  const invoices = await prisma.invoice.findMany({
    where: { lease: { tenantId: tenant.id } },
    orderBy: { periodStart: "desc" },
    include: { lease: { include: { property: true } } },
  });

  return invoices.map(toInvoice);
}

export async function getInvoice(userId: string, id: string) {
  const tenant = await getTenant(userId);

  const own = await prisma.invoice.findFirst({ where: { id, lease: { tenantId: tenant.id } } });
  if (!own) {
    throw new AppError(404, "Рахунок не знайдено");
  }

  await refreshInvoice(id);

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      lease: { include: { property: true } },
      items: true,
      payments: { where: { status: "SUCCESS" }, orderBy: { paidAt: "asc" } },
    },
  });

  if (!invoice) {
    throw new AppError(404, "Рахунок не знайдено");
  }

  return {
    ...toInvoice(invoice),
    items: invoice.items.map((item) => ({
      id: item.id,
      type: item.type,
      description: item.description,
      amount: num(item.amount),
    })),
    payments: invoice.payments.map((p) => ({
      id: p.id,
      amount: num(p.amount),
      method: p.method,
      status: p.status,
      paidAt: p.paidAt,
    })),
  };
}