import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/Modal/Modal";
import { Select } from "../../components/ui/Select/Select";
import { Button } from "../../components/ui/Button/Button";
import { useRenewLease } from "../../hooks/useLeases";
import type { Lease, RenewResult } from "../../api/leases";
import { addMonths, formatDate, formatMoney } from "../../utils/format";
import styles from "./Leases.module.scss";

type Props = {
  lease: Lease | null;
  onClose: () => void;
  onDone: (result: RenewResult) => void;
};

export function RenewModal({ lease, onClose, onDone }: Props) {
  const renew = useRenewLease();
  const [months, setMonths] = useState("12");
  const [error, setError] = useState("");

  useEffect(() => {
    if (lease) {
      setMonths("12");
      setError("");
    }
  }, [lease?.id]);

  // той самий розрахунок, що й на сервері: нова оренда = стара × (1 + індексація / 100)
  const rent = lease?.rentAmount ?? 0;
  const percent = lease?.indexationPercent ?? 0;
  const newRent = Math.round(rent * (1 + percent / 100) * 100) / 100;
  const newEnd = lease ? addMonths(lease.endDate, Number(months)) : null;

  async function submit() {
    if (!lease) {
      return;
    }

    setError("");
    try {
      const result = await renew.mutateAsync({ id: lease.id, months: Number(months) });
      onDone(result);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося продовжити договір");
    }
  }

  return (
    <Modal open={lease !== null} title="Продовжити договір" onClose={onClose}>
      <div className={styles.stack}>
        <Select label="На який термін" value={months} onChange={(e) => setMonths(e.target.value)}>
          <option value="6">6 місяців</option>
          <option value="12">12 місяців</option>
          <option value="24">24 місяці</option>
          <option value="36">36 місяців</option>
        </Select>

        <div className={styles.preview}>
          <div>
            <span className={styles.muted}>Новий термін до</span>
            <strong>{newEnd ? newEnd.toLocaleDateString("uk-UA", { timeZone: "UTC" }) : "-"}</strong>
          </div>
          <div>
            <span className={styles.muted}>Оренда з індексацією {percent}%</span>
            <strong>
              {formatMoney(rent)} → {formatMoney(newRent)}
            </strong>
          </div>
        </div>

        {error && <div className={styles.alert}>{error}</div>}

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>
            Скасувати
          </Button>
          <Button loading={renew.isPending} onClick={submit}>
            Продовжити
          </Button>
        </div>
      </div>
    </Modal>
  );
}