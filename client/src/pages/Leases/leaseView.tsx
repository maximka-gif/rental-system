import type { ReactNode } from "react";
import { Ban, Check, Clock, FileText, Hourglass } from "lucide-react";
import type { Lease } from "../../api/leases";
import { daysLeft } from "../../utils/format";

export const EXPIRING_DAYS = 60;

type LeaseView = {
  label: string;
  tone: "success" | "warning" | "danger" | "neutral";
  icon: ReactNode;
};

// договір, що закінчується протягом 60 днів, підсвічуємо як попередження
export function leaseView(lease: Pick<Lease, "status" | "endDate">): LeaseView {
  if (lease.status === "ACTIVE") {
    const days = daysLeft(lease.endDate);

    if (days <= EXPIRING_DAYS) {
      return {
        label: days > 0 ? `Закінчується через ${days} дн.` : "Термін минув",
        tone: "warning",
        icon: <Clock size={13} />,
      };
    }

    return { label: "Діє", tone: "success", icon: <Check size={13} /> };
  }

  if (lease.status === "DRAFT") {
    return { label: "Чернетка", tone: "neutral", icon: <FileText size={13} /> };
  }

  if (lease.status === "EXPIRED") {
    return { label: "Завершений", tone: "neutral", icon: <Hourglass size={13} /> };
  }

  return { label: "Розірваний", tone: "danger", icon: <Ban size={13} /> };
}