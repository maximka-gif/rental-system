import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/Modal/Modal";
import { Textarea } from "../../components/ui/Textarea/Textarea";
import { Button } from "../../components/ui/Button/Button";
import { useTerminateLease } from "../../hooks/useLeases";
import type { Lease } from "../../api/leases";
import styles from "./Leases.module.scss";

type Props = {
  lease: Lease | null;
  onClose: () => void;
  onDone: (lease: Lease) => void;
};

export function TerminateModal({ lease, onClose, onDone }: Props) {
  const terminate = useTerminateLease();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (lease) {
      setReason("");
      setError("");
    }
  }, [lease?.id]);

  async function submit() {
    if (!lease) {
      return;
    }

    if (reason.trim() === "") {
      setError("Вкажіть причину розірвання");
      return;
    }

    setError("");
    try {
      const updated = await terminate.mutateAsync({ id: lease.id, reason: reason.trim() });
      onDone(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося розірвати договір");
    }
  }

  return (
    <Modal open={lease !== null} title="Розірвати договір?" onClose={onClose}>
      <div className={styles.stack}>
        <p>
          Договір {lease?.number} буде розірвано, а об'єкт «{lease?.property.title}» стане вільним.
        </p>

        <Textarea
          label="Причина розірвання"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {error && <div className={styles.alert}>{error}</div>}

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>
            Скасувати
          </Button>
          <Button variant="danger" loading={terminate.isPending} onClick={submit}>
            Розірвати
          </Button>
        </div>
      </div>
    </Modal>
  );
}