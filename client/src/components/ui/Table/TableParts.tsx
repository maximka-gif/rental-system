import type { ReactNode } from "react";
import styles from "./Table.module.scss";

// комірка з іконкою, назвою та підписом
export function CellMain({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className={styles.cellMain}>
      <span className={styles.cellIcon}>{icon}</span>
      <div className={styles.cellText}>
        <span className={styles.cellTitle}>{title}</span>
        {subtitle && <span className={styles.cellSub}>{subtitle}</span>}
      </div>
    </div>
  );
}

// сума грошей
export function Money({ value }: { value: number }) {
  return (
    <span className={styles.money}>
      {value.toLocaleString("uk-UA")} <small>грн</small>
    </span>
  );
}

// кнопки дій, з'являються при наведенні на рядок
export function RowActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}