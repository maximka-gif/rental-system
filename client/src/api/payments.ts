import { api } from "./client";

export type CheckoutResult = {
  mode: "mock" | "liqpay";
  orderId: string;
  amount: number;
  checkoutUrl: string;
  data?: string;
  signature?: string;
};

export type PaymentState = {
  orderId: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  amount: number;
  invoiceId: string;
  invoiceNumber: string;
};

export function startCheckout(invoiceId: string) {
  return api<CheckoutResult>(`/payments/invoices/${invoiceId}/checkout`, { method: "POST" });
}

export function syncPayment(orderId: string) {
  return api<PaymentState>(`/payments/${orderId}/sync`, { method: "POST" });
}

export function completeMockPayment(orderId: string, success: boolean) {
  return api<PaymentState>(`/payments/mock/${orderId}/complete`, {
    method: "POST",
    body: { success },
  });
}

// переходимо на сторінку оплати: власну (імітація) або LiqPay (POST-форма з підписаними даними)
export function goToCheckout(result: CheckoutResult) {
  if (result.mode === "mock") {
    window.location.href = result.checkoutUrl;
    return;
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = result.checkoutUrl;
  form.acceptCharset = "utf-8";

  const fields: [string, string][] = [
    ["data", result.data ?? ""],
    ["signature", result.signature ?? ""],
  ];

  for (const [name, value] of fields) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}