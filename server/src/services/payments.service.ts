import crypto from "crypto";
import { prisma } from "../db";
import { AppError } from "../utils/errors";
import { round2 } from "../utils/date";
import { refreshInvoice } from "./invoices.service";
import * as liqpay from "./liqpay.service";

type Payload = Record<string, any>;

function mapStatus(status: string): "SUCCESS" | "FAILED" | null {
  if (status === "success" || status === "sandbox") {
    return "SUCCESS";
  }
  if (status === "failure" || status === "error") {
    return "FAILED";
  }
  // решта статусів (очікування, обробка) означають, що платіж ще не завершений
  return null;
}

// єдине місце, де результат оплати потрапляє в систему (вебхук, перевірка статусу, імітація)
export async function applyResult(orderId: string, liqStatus: string, payload: Payload) {
  const payment = await prisma.payment.findUnique({ where: { providerOrderId: orderId } });
  if (!payment) {
    throw new AppError(404, "Платіж не знайдено");
  }

  const next = mapStatus(liqStatus);
  if (next === null) {
    return;
  }

  if (next === "SUCCESS") {
    // сума в платежі має збігатися з тією, яку ми виставили
    const amountOk = Math.abs(Number(payload.amount) - Number(payment.amount)) < 0.01;
    if (!amountOk) {
      throw new AppError(400, "Сума платежу не збігається з рахунком");
    }

    // оновлюємо лише платіж у стані PENDING, тож повторний виклик нічого не зіпсує
    const updated = await prisma.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: {
        status: "SUCCESS",
        paidAt: new Date(),
        providerPaymentId: payload.payment_id ? String(payload.payment_id) : null,
        providerPayload: payload as any,
      },
    });

    if (updated.count === 1) {
      await refreshInvoice(payment.invoiceId);
    }
    return;
  }

  await prisma.payment.updateMany({
    where: { id: payment.id, status: "PENDING" },
    data: { status: "FAILED", providerPayload: payload as any },
  });
}

// орендар починає оплату свого рахунку
export async function startCheckout(userId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, lease: { tenant: { userId } } },
  });
  if (!invoice) {
    throw new AppError(404, "Рахунок не знайдено");
  }

  if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
    throw new AppError(409, "Цей рахунок уже закрито");
  }

  // актуалізуємо пеню, щоб орендар платив точну суму
  await refreshInvoice(invoice.id);

  const fresh = await prisma.invoice.findUnique({ where: { id: invoice.id } });
  if (!fresh) {
    throw new AppError(404, "Рахунок не знайдено");
  }

  const amount = round2(Number(fresh.totalAmount) - Number(fresh.paidAmount));
  if (amount <= 0) {
    throw new AppError(409, "Рахунок уже сплачено");
  }

  const orderId = `pay-${crypto.randomBytes(8).toString("hex")}`;

  await prisma.payment.create({
    data: { invoiceId: invoice.id, amount, method: "CARD", status: "PENDING", providerOrderId: orderId },
  });

  const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";
  const mode = liqpay.paymentMode();

  if (mode === "mock") {
    return { mode, orderId, amount, checkoutUrl: `${clientUrl}/pay/mock/${orderId}` };
  }

  const publicApi = process.env.PUBLIC_API_URL;
  const checkout = liqpay.buildCheckout({
    orderId,
    amount,
    description: `Оплата рахунку ${invoice.number}`,
    resultUrl: `${clientUrl}/my/pay/result?order=${orderId}`,
    serverUrl: publicApi ? `${publicApi}/api/payments/liqpay/callback` : undefined,
  });

  return { mode, orderId, amount, ...checkout };
}

// повертає стан платежу, а для справжнього LiqPay ще й звіряє його з шлюзом
export async function sync(userId: string, orderId: string) {
  const payment = await prisma.payment.findFirst({
    where: {
      providerOrderId: orderId,
      invoice: {
        lease: {
          OR: [{ tenant: { userId } }, { property: { ownerId: userId } }],
        },
      },
    },
    include: { invoice: true },
  });

  if (!payment) {
    throw new AppError(404, "Платіж не знайдено");
  }

  if (payment.status === "PENDING" && liqpay.paymentMode() === "liqpay") {
    const remote = await liqpay.fetchStatus(orderId);
    if (remote.status) {
      await applyResult(orderId, String(remote.status), remote);
    }
  }

  const fresh = await prisma.payment.findUnique({ where: { id: payment.id } });

  return {
    orderId,
    status: fresh ? fresh.status : payment.status,
    amount: Number(payment.amount),
    invoiceId: payment.invoiceId,
    invoiceNumber: payment.invoice.number,
  };
}

// імітація шлюзу: орендар сам обирає «успішно» або «відхилено»
export async function mockComplete(userId: string, orderId: string, success: boolean) {
  if (liqpay.paymentMode() !== "mock") {
    throw new AppError(404, "Недоступно");
  }

  const payment = await prisma.payment.findFirst({
    where: { providerOrderId: orderId, invoice: { lease: { tenant: { userId } } } },
  });
  if (!payment) {
    throw new AppError(404, "Платіж не знайдено");
  }

  if (payment.status !== "PENDING") {
    throw new AppError(409, "Платіж уже оброблено");
  }

  await applyResult(orderId, success ? "success" : "failure", {
    amount: Number(payment.amount),
    currency: "UAH",
    payment_id: `mock-${Date.now()}`,
  });

  return sync(userId, orderId);
}