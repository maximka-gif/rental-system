import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const NOW = new Date();
const DAY = 86400000;
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));

function monthsBetween(start: Date, end: Date) {
  const res: Date[] = [];
  let y = start.getUTCFullYear();
  let m = start.getUTCMonth();
  while (y < end.getUTCFullYear() || (y === end.getUTCFullYear() && m <= end.getUTCMonth())) {
    res.push(utc(y, m, 1));
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return res;
}

// режими: ALL_PAID — усе сплачено; LAST_UNPAID — не сплачений лише поточний місяць;
// DEBTOR — минулий місяць частково, поточний не сплачений
async function createInvoices(
  lease: { id: string; rentAmount: any; startDate: Date },
  tag: string,
  paymentDay: number,
  mode: "ALL_PAID" | "LAST_UNPAID" | "DEBTOR",
  utilitiesBase: number
) {
  const months = monthsBetween(lease.startDate, NOW);
  const rent = Number(lease.rentAmount);
  const n = months.length;

  for (let i = 0; i < n; i++) {
    const first = months[i];
    const y = first.getUTCFullYear();
    const m = first.getUTCMonth();
    const due = utc(y, m, paymentDay);
    const isLast = i === n - 1;
    const isPrev = i === n - 2;

    const unpaid = (mode === "LAST_UNPAID" && isLast) || (mode === "DEBTOR" && isLast);
    const partial = mode === "DEBTOR" && isPrev;
    const pastDue = due.getTime() < NOW.getTime();

    const utilities = utilitiesBase + ((i * 37) % 9) * 100;
    const items: { type: any; description: string; amount: number }[] = [
      { type: "RENT", description: "Орендна плата", amount: rent },
      { type: "UTILITIES", description: "Комунальні послуги", amount: utilities },
    ];

    if ((unpaid || partial) && pastDue) {
      const days = Math.max(1, Math.floor((NOW.getTime() - due.getTime()) / DAY));
      const penalty = Math.round(rent * (0.1 / 100) * days * 100) / 100;
      items.push({ type: "PENALTY", description: `Пеня за ${days} дн. прострочення`, amount: penalty });
    }

    const total = items.reduce((s, it) => s + it.amount, 0);
    let status: any = "PAID";
    let paidAmount = total;
    if (unpaid) {
      paidAmount = 0;
      status = pastDue ? "OVERDUE" : "PENDING";
    } else if (partial) {
      paidAmount = 5000;
      status = "PARTIAL";
    }

    const number = `INV-${y}${String(m + 1).padStart(2, "0")}-${tag}`;
    const invoice = await prisma.invoice.create({
      data: {
        number,
        leaseId: lease.id,
        periodStart: first,
        periodEnd: utc(y, m + 1, 0),
        issueDate: utc(y, m, 1),
        dueDate: due,
        totalAmount: total,
        paidAmount,
        status,
        items: { create: items },
      },
    });

    if (paidAmount > 0) {
      const paidAt = new Date(Math.min(due.getTime() - DAY * (1 + (i % 3)), NOW.getTime()));
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: paidAmount,
          method: "CARD",
          status: "SUCCESS",
          providerOrderId: `seed-${number}`,
          providerPaymentId: `LP-${1000000 + i * 17 + tag.length}`,
          paidAt,
        },
      });
    }
  }
}

async function main() {
  // ── очищення (порядок важливий через зв'язки) ──
  await prisma.auditLog.deleteMany();
  await prisma.notificationSetting.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.requestComment.deleteMany();
  await prisma.requestPhoto.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.leaseDocument.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.propertyPhoto.deleteMany();
  await prisma.property.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // ── користувачі ──
  const admin = await prisma.user.create({
    data: { email: "admin@test.com", passwordHash, role: "ADMIN", firstName: "Адмін", lastName: "Системний" },
  });
  const owner = await prisma.user.create({
    data: { email: "owner@test.com", passwordHash, role: "OWNER", firstName: "Максим", lastName: "Коваленко", phone: "+380501112233" },
  });
  const tenantUser1 = await prisma.user.create({
    data: { email: "tenant1@test.com", passwordHash, role: "TENANT", firstName: "Олена", lastName: "Петренко", phone: "+380671234567" },
  });
  const tenantUser2 = await prisma.user.create({
    data: { email: "tenant2@test.com", passwordHash, role: "TENANT", firstName: "Андрій", lastName: "Шевченко", phone: "+380931234567" },
  });

  // ── об'єкти ──
    const propA = await prisma.property.create({
    data: {
      ownerId: owner.id, title: "1-кімн. квартира в центрі", type: "APARTMENT", status: "RENTED",
      city: "Чернівці", address: "вул. Ольги Кобилянської, 21, кв. 4", area: 38.5, rooms: 1, floor: 3,
      description: "Світла квартира в історичному центрі, з меблями та технікою.",
      baseRent: 15000, purchasePrice: 2100000,
      photos: { create: [{ url: "https://picsum.photos/seed/propA/800/600", isCover: true }] },
    },
  });
  const propB = await prisma.property.create({
    data: {
      ownerId: owner.id, title: "2-кімн. квартира, Сторожинецька", type: "APARTMENT", status: "RENTED",
      city: "Чернівці", address: "вул. Сторожинецька, 45, кв. 17", area: 62, rooms: 2, floor: 5,
      description: "Сучасний ремонт, кондиціонер, паркомісце у дворі.",
      baseRent: 22000, purchasePrice: 3400000,
      photos: { create: [{ url: "https://picsum.photos/seed/propB/800/600", isCover: true }] },
    },
  });
  const propC = await prisma.property.create({
    data: {
      ownerId: owner.id, title: "Студія біля університету", type: "APARTMENT", status: "RENTED",
      city: "Чернівці", address: "вул. Коцюбинського, 6, кв. 9", area: 24, rooms: 1, floor: 2,
      description: "Невелика студія поруч із Чернівецьким національним університетом.",
      baseRent: 9500, purchasePrice: 1300000,
      photos: { create: [{ url: "https://picsum.photos/seed/propC/800/600", isCover: true }] },
    },
  });
  const propD = await prisma.property.create({
    data: {
      ownerId: owner.id, title: "Будинок із садом, Садгора", type: "HOUSE", status: "VACANT",
      city: "Чернівці", address: "вул. Головна, 120", area: 110, rooms: 4, floor: 1,
      description: "Приватний будинок із ділянкою 6 соток.",
      baseRent: 30000, purchasePrice: 4800000,
      photos: { create: [{ url: "https://picsum.photos/seed/propD/800/600", isCover: true }] },
    },
  });

  // ── орендарі ──
  const tenant1 = await prisma.tenant.create({
    data: {
      ownerId: owner.id, userId: tenantUser1.id, firstName: "Олена", lastName: "Петренко",
      email: "tenant1@test.com", phone: "+380671234567", documentNumber: "AB123456",
      birthDate: utc(1995, 2, 14), reliabilityScore: 98,
    },
  });
  const tenant2 = await prisma.tenant.create({
    data: {
      ownerId: owner.id, userId: tenantUser2.id, firstName: "Андрій", lastName: "Шевченко",
      email: "tenant2@test.com", phone: "+380931234567", documentNumber: "CD654321",
      birthDate: utc(1989, 7, 3), reliabilityScore: 90,
    },
  });
  const tenant3 = await prisma.tenant.create({
    data: {
      ownerId: owner.id, firstName: "Ігор", lastName: "Мельник",
      email: "tenant3@test.com", phone: "+380991112233", documentNumber: "EF111222",
      birthDate: utc(2001, 10, 21), reliabilityScore: 62,
      inviteToken: "invite-demo-token-123", invitedAt: NOW,
      notes: "Запрошення ще не прийняте",
    },
  });

  // ── договори ──
  const leaseA = await prisma.lease.create({
    data: {
      number: "L-2026-001", propertyId: propA.id, tenantId: tenant1.id, status: "ACTIVE",
      startDate: utc(2026, 4, 1), endDate: utc(2027, 3, 30),
      rentAmount: 15000, depositAmount: 15000, paymentDay: 5,
      penaltyRatePerDay: 0.1, indexationPercent: 5, autoRenew: true,
      documents: { create: [{ name: "Договір оренди L-2026-001", type: "CONTRACT", url: "/uploads/demo-contract.pdf" }] },
    },
  });
  const leaseB = await prisma.lease.create({
    data: {
      number: "L-2026-002", propertyId: propB.id, tenantId: tenant2.id, status: "ACTIVE",
      startDate: utc(2026, 5, 1), endDate: utc(2027, 4, 30),
      rentAmount: 22000, depositAmount: 22000, paymentDay: 25,
      penaltyRatePerDay: 0.1, indexationPercent: 7, autoRenew: false,
      documents: { create: [{ name: "Договір оренди L-2026-002", type: "CONTRACT", url: "/uploads/demo-contract.pdf" }] },
    },
  });
  const leaseC = await prisma.lease.create({
    data: {
      number: "L-2026-003", propertyId: propC.id, tenantId: tenant3.id, status: "ACTIVE",
      startDate: utc(2026, 3, 1), endDate: utc(2026, 11, 31), // скоро закінчується
      rentAmount: 9500, depositAmount: 9500, paymentDay: 10,
      penaltyRatePerDay: 0.1, indexationPercent: 0, autoRenew: false,
      documents: { create: [{ name: "Договір оренди L-2026-003", type: "CONTRACT", url: "/uploads/demo-contract.pdf" }] },
    },
  });

  // ── рахунки та платежі ──
  await createInvoices(leaseA, "A", 5, "ALL_PAID", 1200);
  await createInvoices(leaseB, "B", 25, "LAST_UNPAID", 1800);
  await createInvoices(leaseC, "C", 10, "DEBTOR", 900);

  // ── заявки на ремонт ──
  const req1 = await prisma.maintenanceRequest.create({
    data: {
      propertyId: propA.id, tenantId: tenant1.id, title: "Тече кран на кухні",
      description: "Крапає змішувач, потрібна заміна прокладки або крана.",
      priority: "MEDIUM", status: "DONE", cost: 850, resolvedAt: new Date(NOW.getTime() - 20 * DAY),
      createdAt: new Date(NOW.getTime() - 25 * DAY),
      photos: { create: [{ url: "https://picsum.photos/seed/req1/600/400" }] },
    },
  });
  await prisma.maintenanceRequest.create({
    data: {
      propertyId: propB.id, tenantId: tenant2.id, title: "Не працює кондиціонер",
      description: "Кондиціонер вмикається, але не охолоджує.",
      priority: "HIGH", status: "IN_PROGRESS", createdAt: new Date(NOW.getTime() - 4 * DAY),
    },
  });
  await prisma.maintenanceRequest.create({
    data: {
      propertyId: propC.id, tenantId: tenant3.id, title: "Зламаний замок вхідних дверей",
      description: "Замок заїдає, двері складно відкрити.",
      priority: "URGENT", status: "NEW", createdAt: new Date(NOW.getTime() - 1 * DAY),
    },
  });
  await prisma.maintenanceRequest.create({
    data: {
      propertyId: propA.id, tenantId: tenant1.id, title: "Заміна лампочок у коридорі",
      description: "Перегоріли дві лампи.", priority: "LOW", status: "DONE", cost: 200,
      resolvedAt: new Date(NOW.getTime() - 60 * DAY), createdAt: new Date(NOW.getTime() - 65 * DAY),
    },
  });

  await prisma.requestComment.createMany({
    data: [
      { requestId: req1.id, authorId: tenantUser1.id, text: "Доброго дня, кран тече вже два дні.", createdAt: new Date(NOW.getTime() - 25 * DAY) },
      { requestId: req1.id, authorId: owner.id, text: "Дякую, завтра прийде майстер.", createdAt: new Date(NOW.getTime() - 24 * DAY) },
      { requestId: req1.id, authorId: owner.id, text: "Кран замінено, перевірте будь ласка.", createdAt: new Date(NOW.getTime() - 20 * DAY) },
    ],
  });

  // ── витрати ──
  const expenses: any[] = [];
  const rentedProps = [propA, propB, propC];
  rentedProps.forEach((p, pi) => {
    monthsBetween(utc(2026, 4, 1), NOW).forEach((mDate, i) => {
      expenses.push({
        propertyId: p.id, category: "UTILITIES",
        amount: 400 + ((i + pi) * 53) % 5 * 100,
        date: utc(mDate.getUTCFullYear(), mDate.getUTCMonth(), 15),
        description: "Спільні комунальні витрати (ОСББ)",
      });
    });
    expenses.push({ propertyId: p.id, category: "INSURANCE", amount: 3600, date: utc(2026, 4, 10), description: "Страхування майна на рік" });
    expenses.push({ propertyId: p.id, category: "TAX", amount: 2500 + pi * 800, date: utc(2026, 8, 20), description: "Податок на нерухомість" });
  });
  expenses.push({ propertyId: propA.id, requestId: req1.id, category: "REPAIR", amount: 850, date: new Date(NOW.getTime() - 20 * DAY), description: "Заміна змішувача" });
  expenses.push({ propertyId: propD.id, category: "CLEANING", amount: 1500, date: utc(2026, 9, 5), description: "Прибирання перед пошуком орендаря" });
  await prisma.expense.createMany({ data: expenses });

  // ── сповіщення ──
  await prisma.notification.createMany({
    data: [
      { userId: owner.id, type: "PAYMENT_RECEIVED", title: "Отримано оплату", body: "Олена Петренко сплатила рахунок за поточний місяць.", link: "/payments", isRead: false },
      { userId: owner.id, type: "PAYMENT_OVERDUE", title: "Прострочений платіж", body: "Ігор Мельник має заборгованість за студію біля університету.", link: "/payments", isRead: false },
      { userId: owner.id, type: "REQUEST_CREATED", title: "Нова заявка на ремонт", body: "Зламаний замок вхідних дверей (студія).", link: "/requests", isRead: false },
      { userId: owner.id, type: "LEASE_EXPIRING", title: "Договір скоро закінчується", body: "Договір L-2026-003 завершується 31.12.2026.", link: "/leases", isRead: true },
      { userId: tenantUser1.id, type: "INVOICE_ISSUED", title: "Виставлено рахунок", body: "Новий рахунок за оренду готовий до оплати.", link: "/my/invoices", isRead: true },
      { userId: tenantUser2.id, type: "REQUEST_STATUS_CHANGED", title: "Статус заявки змінено", body: "Заявка «Не працює кондиціонер» тепер у роботі.", link: "/my/requests", isRead: false },
      { userId: tenantUser2.id, type: "PAYMENT_REMINDER", title: "Нагадування про оплату", body: "Оплатіть рахунок до 25 числа.", link: "/my/invoices", isRead: false },
    ],
  });

  // ── налаштування сповіщень ──
  const types = [
    "INVOICE_ISSUED", "PAYMENT_REMINDER", "PAYMENT_RECEIVED", "PAYMENT_OVERDUE", "LEASE_EXPIRING",
    "LEASE_CREATED", "REQUEST_CREATED", "REQUEST_STATUS_CHANGED", "REQUEST_COMMENT", "SYSTEM",
  ];
  const settings: any[] = [];
  [owner, tenantUser1, tenantUser2].forEach((u) =>
    types.forEach((t) => settings.push({ userId: u.id, type: t, inApp: true, email: true, push: false }))
  );
  await prisma.notificationSetting.createMany({ data: settings });

  // ── журнал дій ──
  await prisma.auditLog.createMany({
    data: [
      { userId: owner.id, action: "LEASE_CREATED", entity: "Lease", entityId: leaseA.id },
      { userId: owner.id, action: "LEASE_CREATED", entity: "Lease", entityId: leaseB.id },
      { userId: owner.id, action: "LEASE_CREATED", entity: "Lease", entityId: leaseC.id },
      { userId: admin.id, action: "SEED_COMPLETED", entity: "System" },
    ],
  });

  console.log("✅ Seed завершено");
  console.log("Логіни (пароль для всіх: password123):");
  console.log("  admin@test.com   — адміністратор");
  console.log("  owner@test.com   — власник");
  console.log("  tenant1@test.com — орендар (квартира в центрі)");
  console.log("  tenant2@test.com — орендар (Сторожинецька)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });