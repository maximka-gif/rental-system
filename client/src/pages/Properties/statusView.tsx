import type { ReactNode } from "react";
import { DoorOpen, KeyRound, Wrench } from "lucide-react";
import type { PropertyStatus } from "../../api/properties";

export const statusView: Record<
  PropertyStatus,
  { label: string; tone: "success" | "info" | "warning"; icon: ReactNode }
> = {
  RENTED: { label: "Здано", tone: "success", icon: <KeyRound size={13} /> },
  VACANT: { label: "Вільно", tone: "info", icon: <DoorOpen size={13} /> },
  MAINTENANCE: { label: "Ремонт", tone: "warning", icon: <Wrench size={13} /> },
};