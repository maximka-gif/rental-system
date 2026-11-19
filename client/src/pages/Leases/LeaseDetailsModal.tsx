import { useEffect, useState } from "react";
import { Check, Pencil, RefreshCw, Trash2, Ban } from "lucide-react";
import { Modal } from "../../components/ui/Modal/Modal";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { useActivateLease } from "../../hooks/useLeases";
import type { Lease } from "../../api/leases";
import { formatDate, formatMoney } from "../../utils/format";
import { leaseView } from "./leaseView";
import { RenewModal } from "./RenewModal";
import { TerminateModal } from "./TerminateModal";
import styles from "./Leases.module.scss";

type Props = {
  lease: Lease | null;
  onClose: () => void;
  onUpdated: (lease: Lease) => void;
  onEdit: (lease: Lease) => void;
  onDelete: (lease: Lease) => void;
};

export function LeaseDetailsModal({ lease, onClose, onUpdated, onEdit, onDelete }: Props) {
  const activate = useActivateLease();
  const [renewing, setRenewing] = useState<Lease | null>(null);
  const [terminating, setTerminating] = useState<Lease | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setNotice("");
    setError("");
  }, [lease?.id]);

  async function handleActivate() {
    if (!lease) {
      return;
    }

    setError("");
    try {
      const updated = await activate.mutateAsync(lease.id);
      onUpdated(updated);
      setNotice("Договір активовано, об'єкт отримав статус «Здано».");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося активувати договір");
    }
  }

  const view = lease ? leaseView(lease) : null;

  const info = lease
    ? [
        { label: "Об'єкт", value: lease.property.title },
        { label: "Орендар", value: lease.tenant.name },
        { label: "Період", value: `${formatDate(lease.startDate)} - ${formatDate(lease.endDate)}` },
        { label: "Оренда на місяць", value: formatMoney(lease.rentAmount) },
        { label: "Завдаток", value: formatMoney(lease.depositAmount) },
        { label: "Оплата до", value: `${lease.paymentDay} числа` },
        { label: "Пеня за день", value: `${lease.penaltyRatePerDay}%` },
        { label: "Індексація", value: `${lease.indexationPercent}% на рік` },
        { label: "Автопродовження", value: lease.autoRenew ? "Так" : "Ні" },
      ]
    : [];

  return (
    <>
      <Modal open={lease !== null} title={`Договір ${lease?.number ?? ""}`} onClose={onClose}>
        {lease && view && (
          <div className={styles.stack}>
            <div>
              <Badge tone={view.tone} icon={view.icon}>
                {view.label}
              </Badge>
            </div>

            <dl className={styles.infoGrid}>
              {info.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>

            {lease.notes && <p className={styles.muted}>Примітки: {lease.notes}</p>}

            {lease.status === "TERMINATED" && (
              <div className={styles.alert}>
                Розірвано {lease.terminatedAt ? formatDate(lease.terminatedAt) : ""}. Причина:{" "}
                {lease.terminationReason}
              </div>
            )}

            {notice && <div className={styles.success}>{notice}</div>}
            {error && <div className={styles.alert}>{error}</div>}

            <div className={styles.actions}>
              {lease.status === "DRAFT" && (
                <>
                  <Button variant="ghost" onClick={() => onDelete(lease)}>
                    <Trash2 size={16} />
                    Видалити
                  </Button>
                  <Button variant="secondary" onClick={() => onEdit(lease)}>
                    <Pencil size={16} />
                    Редагувати
                  </Button>
                  <Button loading={activate.isPending} onClick={handleActivate}>
                    <Check size={16} />
                    Активувати
                  </Button>
                </>
              )}

              {lease.status === "ACTIVE" && (
                <>
                  <Button variant="danger" onClick={() => setTerminating(lease)}>
                    <Ban size={16} />
                    Розірвати
                  </Button>
                  <Button onClick={() => setRenewing(lease)}>
                    <RefreshCw size={16} />
                    Продовжити
                  </Button>
                </>
              )}

              {(lease.status === "EXPIRED" || lease.status === "TERMINATED") && (
                <Button variant="secondary" onClick={onClose}>
                  Закрити
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <RenewModal
        lease={renewing}
        onClose={() => setRenewing(null)}
        onDone={(result) => {
          onUpdated(result.lease);
          setNotice(
            `Договір продовжено. Оренда з індексацією ${result.indexationPercent}%: ` +
              `${formatMoney(result.previousRent)} → ${formatMoney(result.newRent)}.`
          );
        }}
      />

      <TerminateModal
        lease={terminating}
        onClose={() => setTerminating(null)}
        onDone={(updated) => {
          onUpdated(updated);
          setNotice("Договір розірвано, об'єкт звільнено.");
        }}
      />
    </>
  );
}