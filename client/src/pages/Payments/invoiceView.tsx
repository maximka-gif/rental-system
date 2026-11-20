import type { ReactNode } from "react";
import { AlertTriangle, Ban, Check, Clock, Wallet } from "lucide-react";
import type { InvoiceStatus, PaymentMethod } from "../../api/invoices";

export const invoiceView: Record<
  InvoiceStatus,
  {
    label: string;
    tone: "success" | "info" | "warning" | "danger" | "neutral";
    icon: ReactNode;
    pulse?: boolean;
  }
> = {
  PAID: { label: "Сплачено", tone: "success", icon: <Check size={13} /> },
  PENDING: { label: "Очікує оплати", tone: "info", icon: <Clock size={13} /> },
  PARTIAL: { label: "Частково", tone: "warning", icon: <Wallet size={13} /> },
  OVERDUE: { label: "Прострочено", tone: "danger", icon: <AlertTriangle size={13} />, pulse: true },
  CANCELLED: { label: "Скасовано", tone: "neutral", icon: <Ban size={13} /> },
};

export const methodLabels: Record<PaymentMethod, string> = {
  CARD: "Картка онлайн",
  CASH: "Готівка",
  BANK_TRANSFER: "Банківський переказ",
};