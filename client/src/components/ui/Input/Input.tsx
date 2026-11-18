import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "../../../utils/cn";
import styles from "./Input.module.scss";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, id, className, ...rest },
  ref
) {
  const inputId = id ?? rest.name;

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(styles.input, error && styles.hasError, className)}
        {...rest}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
});