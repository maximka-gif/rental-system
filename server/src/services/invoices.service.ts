import { prisma } from "../db";
import { AppError } from "../utils/errors";
import { calcPenalty } from "../utils/penalty";
import { DAY, daysInMonth, round2, utcDate, utcDay } from "../utils/date";

const num = (value: unknown) => Number(value);

type Status = "PAID" | "OVERDUE" | "PARTIAL" | "PENDING";

function computeStatus(total: number, paid: number, dueDate: Date, now: Date): Status {
  if (paid >= total - 0.004) {
    return "PAID";
  }
  if (utcDay(now) > utcDay(dueDate)) {
    return "OVERDUE";
  }
  if (paid > 0) {
    return "PARTIAL";
  }
  return "PENDING";
}

const listInclude = {
  lease: { include: { property: true, tenant: true } },
};

function toItem(i: any) {
  const total = num(i.totalAmount);
  const paid = num(i.paidAmount);

  return {
    id: i.id,
    number: i.number,
    status: i.status,
    periodStart: i.periodStart,
    periodEnd: i.periodEnd,
    issueDate: i.issueDate,
    dueDate: i.dueDate,
    totalAmount: total,
    paidAmount: paid,
    debt: round2(Math.max(total - paid, 0)),
    lease: { id: i.lease.id, number: i.lease.number },
    property: { id: i.lease.property.id, title: i.lease.property.title },
    tenant: { id: i.lease.tenant.id, name: `${i.lease.tenant.firstName} ${i.lease.tenant.lastName}` },
  };
}

async function findOwned(ownerId: string, id: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, lease: { property: { ownerId } } },
  });
  if (!invoice) {
    throw new AppError(404, "Рахунок не знайдено");
  }
  return invoice;
}

// перераховує пеню, суму, сплачене й статус рахунку на вказаний момент
export async function refreshInvoice(id: string, now = new Date()) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true, payments: { where: { status: "SUCCESS" } }, lease: true },
  });

  if (!invoice) {
    throw new AppError(404, "Рахунок не знайдено");
  }

  // оплачені й скасовані рахунки більше не змінюються, тож пеня на них «заморожується»
  if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
    return;
  }

  const baseTotal = invoice.items
    .filter((item) => item.type !== "PENALTY")
    .reduce((sum, item) => sum + num(item.amount), 0);

  const payments = invoice.payments.map((p) => ({
    amount: num(p.amount),
    paidAt: p.paidAt ?? p.createdAt,
  }));
  const paid = round2(payments.reduce((sum, p) => sum + p.amount, 0));

  const penalty = calcPenalty({
    baseTotal,
    ratePerDay: num(invoice.lease.penaltyRatePerDay),
    dueDate: invoice.dueDate,
    asOf: now,
    payments,
  });

  const penaltyItem = invoice.items.find((item) => item.type === "PENALTY");
  const ops: any[] = [];

  if (penalty.amount > 0) {
    const description = `Пеня за ${penalty.days} дн. прострочення`;

    if (penaltyItem) {
      ops.push(
        prisma.invoiceItem.update({
          where: { id: penaltyItem.id },
          data: { amount: penalty.amount, description },
        })
      );
    } else {
      ops.push(
        prisma.invoiceItem.create({
          data: { invoiceId: id, type: "PENALTY", description, amount: penalty.amount },
        })
      );
    }
  } else if (penaltyItem) {
    ops.push(prisma.invoiceItem.delete({ where: { id: penaltyItem.id } }));
  }

  const total = round2(baseTotal + penalty.amount);

  ops.push(
    prisma.invoice.update({
      where: { id },
      data: {
        totalAmount: total,
        paidAmount: paid,
        status: computeStatus(total, paid, invoice.dueDate, now),
      },
    })
  );

  await prisma.$transaction(ops);
}

// перераховує всі неоплачені рахунки (це буде щоденне завдання за розкладом)
export async function recalculateAll(ownerId?: string) {
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
      ...(ownerId ? { lease: { property: { ownerId } } } : {}),
    },
    select: { id: true },
  });

  for (const invoice of invoices) {
    await refreshInvoice(invoice.id);
  }

  return { processed: invoices.length };
}

// створює рахунки за місяць ("2026-12") для всіх дійсних договорів
export async function generateForMonth(month: string, ownerId?: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const month0 = monthNumber - 1;

  const totalDays = daysInMonth(year, month0);
  const periodStart = utcDate(year, month0, 1);
  const periodEnd = utcDate(year, month0, totalDays);

  const leases = await prisma.lease.findMany({
    where: {
      status: "ACTIVE",
      startDate: { lte: periodEnd },
      endDate: { gte: periodStart },
      ...(ownerId ? { property: { ownerId } } : {}),
    },
  });

  let created = 0;
  let skipped = 0;

  for (const lease of leases) {
    const exists = await prisma.invoice.findFirst({
      where: { leaseId: lease.id, periodStart },
    });
    if (exists) {
      skipped++;
      continue;
    }

    // період, за який договір діяв у цьому місяці
    const from = lease.startDate.getTime() > periodStart.getTime() ? lease.startDate : periodStart;
    const to = lease.endDate.getTime() < periodEnd.getTime() ? lease.endDate : periodEnd;
    const usedDays = Math.round((to.getTime() - from.getTime()) / DAY) + 1;

    const rent = num(lease.rentAmount);
    let amount = rent;
    let description = "Орендна плата";

    if (usedDays < totalDays) {
      amount = round2((rent * usedDays) / totalDays);
      description = `Орендна плата за ${usedDays} дн. з ${totalDays}`;
    }

    const due = utcDate(year, month0, lease.paymentDay);
    const dueDate = due.getTime() < from.getTime() ? from : due;
    const number = `INV-${year}${String(monthNumber).padStart(2, "0")}-${lease.number}`;

    const invoice = await prisma.invoice.create({
      data: {
        number,
        leaseId: lease.id,
        periodStart,
        periodEnd,
        dueDate,
        totalAmount: amount,
        items: { create: [{ type: "RENT", description, amount }] },
      },
    });

    await refreshInvoice(invoice.id);
    created++;
  }

  return { month, created, skipped };
}

export async function list(
  ownerId: string,
  filters: { status?: string; month?: string; search?: string }
) {
  const where: any = { lease: { property: { ownerId } } };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.month) {
    const [year, monthNumber] = filters.month.split("-").map(Number);
    where.periodStart = utcDate(year, monthNumber - 1, 1);
  }

  if (filters.search) {
    where.OR = [
      { number: { contains: filters.search, mode: "insensitive" } },
      { lease: { property: { title: { contains: filters.search, mode: "insensitive" } } } },
      { lease: { tenant: { firstName: { contains: filters.search, mode: "insensitive" } } } },
      { lease: { tenant: { lastName: { contains: filters.search, mode: "insensitive" } } } },
    ];
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: [{ periodStart: "desc" }, { number: "asc" }],
    include: listInclude,
  });

  return invoices.map(toItem);
}

export async function getById(ownerId: string, id: string) {
  await findOwned(ownerId, id);

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      ...listInclude,
      items: { orderBy: { id: "asc" } },
      payments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!invoice) {
    throw new AppError(404, "Рахунок не знайдено");
  }

  return {
    ...toItem(invoice),
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

export async function addItem(
  ownerId: string,
  id: string,
  data: { type: "UTILITIES" | "OTHER"; description: string; amount: number }
) {
  const invoice = await findOwned(ownerId, id);

  if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
    throw new AppError(409, "Не можна змінювати оплачений або скасований рахунок");
  }

  await prisma.invoiceItem.create({ data: { invoiceId: id, ...data } });
  await refreshInvoice(id);

  return getById(ownerId, id);
}

// ручний платіж: готівка або переказ, про який власник знає сам
export async function recordPayment(
  ownerId: string,
  id: string,
  data: { amount: number; method: "CASH" | "BANK_TRANSFER"; paidAt?: Date }
) {
  const invoice = await findOwned(ownerId, id);

  if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
    throw new AppError(409, "Цей рахунок уже закрито");
  }

  // оновлюємо пеню до сьогодні, щоб знати актуальний борг
  await refreshInvoice(id);

  const fresh = await prisma.invoice.findUnique({ where: { id } });
  if (!fresh) {
    throw new AppError(404, "Рахунок не знайдено");
  }

  const outstanding = round2(num(fresh.totalAmount) - num(fresh.paidAmount));
  if (data.amount > outstanding + 0.004) {
    throw new AppError(400, `Сума перевищує борг по рахунку (${outstanding} грн)`);
  }

  await prisma.payment.create({
    data: {
      invoiceId: id,
      amount: data.amount,
      method: data.method,
      status: "SUCCESS",
      paidAt: data.paidAt ?? new Date(),
    },
  });

  await refreshInvoice(id);

  return getById(ownerId, id);
}

export async function cancel(ownerId: string, id: string) {
  const invoice = await findOwned(ownerId, id);

  if (invoice.status === "CANCELLED") {
    throw new AppError(409, "Рахунок уже скасовано");
  }

  const paymentsCount = await prisma.payment.count({
    where: { invoiceId: id, status: "SUCCESS" },
  });
  if (paymentsCount > 0) {
    throw new AppError(409, "Не можна скасувати рахунок, за яким уже були платежі");
  }

  await prisma.invoice.update({ where: { id }, data: { status: "CANCELLED" } });

  return getById(ownerId, id);
}