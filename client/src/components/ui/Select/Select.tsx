import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "../../../utils/cn";
import styles from "../Input/Input.module.scss";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, error, id, className, children, ...rest },
  ref
) {
  const selectId = id ?? rest.name;

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={selectId}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(styles.input, error && styles.hasError, className)}
        {...rest}
      >
        {children}
      </select>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
});