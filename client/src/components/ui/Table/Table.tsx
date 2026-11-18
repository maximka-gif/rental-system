import type { ReactNode } from "react";
import { cn } from "../../../utils/cn";
import styles from "./Table.module.scss";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

type Column<T> = {
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  getRowTone?: (row: T) => Tone | undefined;
  onRowClick?: (row: T) => void;
  emptyText?: string;
};

export function Table<T>({
  columns,
  rows,
  getRowKey,
  getRowTone,
  onRowClick,
  emptyText = "Немає даних",
}: Props<T>) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.header} style={{ textAlign: col.align ?? "left" }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className={styles.empty} colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              data-tone={getRowTone ? getRowTone(row) : undefined}
              className={cn(onRowClick && styles.clickable)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.header} style={{ textAlign: col.align ?? "left" }}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}