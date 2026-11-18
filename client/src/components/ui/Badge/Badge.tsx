import type { ReactNode } from "react";
import { cn } from "../../../utils/cn";
import styles from "./Badge.module.scss";

type Props = {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  icon?: ReactNode;
  pulse?: boolean;
  children: ReactNode;
};

export function Badge({ tone = "neutral", icon, pulse = false, children }: Props) {
  return (
    <span className={cn(styles.badge, styles[tone], pulse && styles.pulse)}>
      {icon ? (
        <span className={styles.mark}>{icon}</span>
      ) : (
        <span className={styles.dot} />
      )}
      {children}
    </span>
  );
}