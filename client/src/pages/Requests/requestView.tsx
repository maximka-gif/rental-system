import type { ReactNode } from "react";
import { Ban, Check, Inbox, Wrench } from "lucide-react";
import type { RequestPriority, RequestStatus } from "../../api/requests";

export const requestStatusView: Record<
  RequestStatus,
  {
    label: string;
    columnTitle: string;
    tone: "info" | "warning" | "success" | "neutral";
    icon: ReactNode;
  }
> = {
  NEW: { label: "Нова", columnTitle: "Нові", tone: "info", icon: <Inbox size={13} /> },
  IN_PROGRESS: { label: "У роботі", columnTitle: "У роботі", tone: "warning", icon: <Wrench size={13} /> },
  DONE: { label: "Виконана", columnTitle: "Виконані", tone: "success", icon: <Check size={13} /> },
  REJECTED: { label: "Відхилена", columnTitle: "Відхилені", tone: "neutral", icon: <Ban size={13} /> },
};

export const priorityView: Record<RequestPriority, { label: string; tone: "neutral" | "info" | "warning" | "danger" }> = {
  LOW: { label: "Низький", tone: "neutral" },
  MEDIUM: { label: "Звичайний", tone: "info" },
  HIGH: { label: "Високий", tone: "warning" },
  URGENT: { label: "Терміново", tone: "danger" },
};