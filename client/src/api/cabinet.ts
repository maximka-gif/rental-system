import { api } from "./client";
import type { InvoiceItem, InvoicePayment, InvoiceStatus } from "./invoices";

export type CabinetInvoice = {
  id: string;
  number: string;
  status: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  debt: number;
  property: { title: string };
};

export type CabinetInvoiceDetails = CabinetInvoice & {
  items: InvoiceItem[];
  payments: InvoicePayment[];
};

export type CabinetLease = {
  id: string;
  number: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  paymentDay: number;
  penaltyRatePerDay: number;
  indexationPercent: number;
  property: {
    title: string;
    address: string;
    city: string;
    area: number | null;
    rooms: number | null;
    floor: number | null;
    coverUrl: string | null;
  };
};

export type CabinetSummary = {
  tenant: { firstName: string; lastName: string };
  lease: CabinetLease | null;
  debt: number;
  overdueCount: number;
  nextInvoice: CabinetInvoice | null;
};

export function fetchSummary() {
  return api<CabinetSummary>("/cabinet/summary");
}

export function fetchCabinetInvoices() {
  return api<CabinetInvoice[]>("/cabinet/invoices");
}

export function fetchCabinetInvoice(id: string) {
  return api<CabinetInvoiceDetails>(`/cabinet/invoices/${id}`);
}