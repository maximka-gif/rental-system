import type { ReactNode } from "react";
import { cn } from "../../../utils/cn";
import styles from "./Badge.module.scss";

type Props = {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  children: ReactNode;
};

export function Badge({ tone = "neutral", children }: Props) {
  return <span className={cn(styles.badge, styles[tone])}>{children}</span>;
}