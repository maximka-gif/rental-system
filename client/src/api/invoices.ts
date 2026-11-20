import { api } from "./client";

export type InvoiceStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
export type PaymentMethod = "CARD" | "CASH" | "BANK_TRANSFER";

export type Invoice = {
  id: string;
  number: string;
  status: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  debt: number;
  lease: { id: string; number: string };
  property: { id: string; title: string };
  tenant: { id: string; name: string };
};

export type InvoiceItem = {
  id: string;
  type: "RENT" | "UTILITIES" | "PENALTY" | "DEPOSIT" | "OTHER";
  description: string;
  amount: number;
};

export type InvoicePayment = {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  paidAt: string | null;
};

export type InvoiceDetails = Invoice & {
  items: InvoiceItem[];
  payments: InvoicePayment[];
};

export type InvoiceFilters = {
  status: InvoiceStatus | "";
  month: string;
  search: string;
};

export function fetchInvoices(filters: InvoiceFilters) {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.month) {
    params.set("month", filters.month);
  }
  if (filters.search) {
    params.set("search", filters.search);
  }
  const query = params.toString();
  return api<Invoice[]>(`/invoices${query ? `?${query}` : ""}`);
}

export function fetchInvoice(id: string) {
  return api<InvoiceDetails>(`/invoices/${id}`);
}

export function generateInvoices(month: string) {
  return api<{ month: string; created: number; skipped: number }>("/invoices/generate", {
    method: "POST",
    body: { month },
  });
}

export function recalculateInvoices() {
  return api<{ processed: number }>("/invoices/recalculate", { method: "POST" });
}

export function addInvoiceItem(
  id: string,
  data: { type: "UTILITIES" | "OTHER"; description: string; amount: number }
) {
  return api<InvoiceDetails>(`/invoices/${id}/items`, { method: "POST", body: data });
}

export function recordPayment(
  id: string,
  data: { amount: number; method: "CASH" | "BANK_TRANSFER"; paidAt: string }
) {
  return api<InvoiceDetails>(`/invoices/${id}/payments`, { method: "POST", body: data });
}

export function cancelInvoice(id: string) {
  return api<InvoiceDetails>(`/invoices/${id}/cancel`, { method: "POST" });
}