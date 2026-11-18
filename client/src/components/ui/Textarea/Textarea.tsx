import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../../utils/cn";
import styles from "../Input/Input.module.scss";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { label, error, id, className, ...rest },
  ref
) {
  const areaId = id ?? rest.name;

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={areaId}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={areaId}
        rows={3}
        className={cn(styles.input, error && styles.hasError, className)}
        {...rest}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
});