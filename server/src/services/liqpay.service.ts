import crypto from "crypto";
import { AppError } from "../utils/errors";

const CHECKOUT_URL = "https://www.liqpay.ua/api/3/checkout";
const API_URL = "https://www.liqpay.ua/api/request";

export function paymentMode(): "liqpay" | "mock" {
  if (process.env.PAYMENT_MODE === "liqpay") {
    return "liqpay";
  }
  return "mock";
}

function getKeys() {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY;
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new AppError(500, "Ключі LiqPay не налаштовано");
  }

  return { publicKey, privateKey };
}

function encode(params: object) {
  return Buffer.from(JSON.stringify(params)).toString("base64");
}

export function decode(data: string): Record<string, any> {
  return JSON.parse(Buffer.from(data, "base64").toString("utf8"));
}

// підпис за правилом LiqPay: base64(sha1(private_key + data + private_key))
function sign(data: string) {
  const { privateKey } = getKeys();
  return crypto
    .createHash("sha1")
    .update(privateKey + data + privateKey)
    .digest("base64");
}

export function verify(data: string, signature: string) {
  const expected = Buffer.from(sign(data));
  const received = Buffer.from(signature);

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

type CheckoutParams = {
  orderId: string;
  amount: number;
  description: string;
  resultUrl: string;
  serverUrl?: string;
};

export function buildCheckout(params: CheckoutParams) {
  const { publicKey } = getKeys();

  const payload: Record<string, unknown> = {
    version: 3,
    public_key: publicKey,
    action: "pay",
    amount: params.amount,
    currency: "UAH",
    description: params.description,
    order_id: params.orderId,
    language: "uk",
    result_url: params.resultUrl,
  };

  if (params.serverUrl) {
    payload.server_url = params.serverUrl;
  }

  if (process.env.LIQPAY_SANDBOX === "1") {
    payload.sandbox = 1;
  }

  const data = encode(payload);
  return { checkoutUrl: CHECKOUT_URL, data, signature: sign(data) };
}

// запитуємо в LiqPay актуальний статус платежу
export async function fetchStatus(orderId: string): Promise<Record<string, any>> {
  const { publicKey } = getKeys();

  const data = encode({ version: 3, public_key: publicKey, action: "status", order_id: orderId });
  const body = new URLSearchParams({ data, signature: sign(data) });

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new AppError(502, "LiqPay не відповів");
  }

  return res.json();
}