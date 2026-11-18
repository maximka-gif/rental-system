import type { HTMLAttributes } from "react";
import { cn } from "../../../utils/cn";
import styles from "./Card.module.scss";

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(styles.card, className)} {...rest}>
      {children}
    </div>
  );
}