import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../components/ui/Modal/Modal";
import { Select } from "../../components/ui/Select/Select";
import { Button } from "../../components/ui/Button/Button";
import { useGenerateInvoices } from "../../hooks/useInvoices";
import { currentMonth, monthOptions } from "../../utils/format";
import styles from "./Payments.module.scss";

type Props = {
  open: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
};

export function GenerateModal({ open, onClose, onDone }: Props) {
  const generate = useGenerateInvoices();
  const options = useMemo(() => monthOptions(), []);
  const [month, setMonth] = useState(currentMonth());
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setMonth(currentMonth());
      setError("");
    }
  }, [open]);

  async function submit() {
    setError("");
    try {
      const result = await generate.mutateAsync(month);
      const label = options.find((o) => o.value === month)?.label ?? month;

      if (result.created === 0) {
        onDone(`За період «${label}» нових рахунків немає: усі вже створені (пропущено ${result.skipped}).`);
      } else {
        onDone(`За період «${label}» створено рахунків: ${result.created}, пропущено: ${result.skipped}.`);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося створити рахунки");
    }
  }

  return (
    <Modal open={open} title="Створити рахунки" onClose={onClose}>
      <div className={styles.stack}>
        <p className={styles.muted}>
          Рахунок буде створено для кожного дійсного договору. Якщо договір починається чи
          закінчується посеред місяця, оренда рахується за фактичні дні. Дублі не створюються.
        </p>

        <Select label="Період" value={month} onChange={(e) => setMonth(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>

        {error && <div className={styles.alert}>{error}</div>}

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>
            Скасувати
          </Button>
          <Button loading={generate.isPending} onClick={submit}>
            Створити
          </Button>
        </div>
      </div>
    </Modal>
  );
}