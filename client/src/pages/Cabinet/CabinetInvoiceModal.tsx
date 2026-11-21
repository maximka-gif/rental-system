import { useState } from "react";
import { Modal } from "../../components/ui/Modal/Modal";
import { Badge } from "../../components/ui/Badge/Badge";
import { useCabinetInvoice } from "../../hooks/useCabinet";
import { formatDate, formatMoney } from "../../utils/format";
import { invoiceView, methodLabels } from "../Payments/invoiceView";
import { PayButton } from "./PayButton";
import { cn } from "../../utils/cn";
import styles from "../Payments/Payments.module.scss";

type Props = {
  invoiceId: string | null;
  onClose: () => void;
};

export function CabinetInvoiceModal({ invoiceId, onClose }: Props) {
  const { data, isLoading, isError } = useCabinetInvoice(invoiceId);
  const [error, setError] = useState("");

  const view = data ? invoiceView[data.status] : null;
  const canPay = data ? data.status !== "PAID" && data.status !== "CANCELLED" && data.debt > 0 : false;

  return (
    <Modal open={invoiceId !== null} title={data ? `Рахунок ${data.number}` : "Рахунок"} onClose={onClose}>
      {isLoading && <p>Завантаження...</p>}
      {isError && <div className={styles.alert}>Не вдалося завантажити рахунок</div>}

      {data && view && (
        <div className={styles.stack}>
          <div className={styles.topRow}>
            <Badge tone={view.tone} icon={view.icon} pulse={view.pulse}>
              {view.label}
            </Badge>
            <span className={styles.muted}>{data.property.title}</span>
          </div>

          <dl className={styles.meta}>
            <div>
              <dt>Період</dt>
              <dd>
                {formatDate(data.periodStart)} - {formatDate(data.periodEnd)}
              </dd>
            </div>
            <div>
              <dt>Оплатити до</dt>
              <dd>{formatDate(data.dueDate)}</dd>
            </div>
          </dl>

          <ul className={styles.items}>
            {data.items.map((item) => (
              <li key={item.id} className={cn(item.type === "PENALTY" && styles.penalty)}>
                <span>{item.description}</span>
                <strong>{formatMoney(item.amount)}</strong>
              </li>
            ))}
          </ul>

          <div className={styles.totals}>
            <div>
              <span>Разом</span>
              <strong>{formatMoney(data.totalAmount)}</strong>
            </div>
            <div>
              <span>Сплачено</span>
              <strong>{formatMoney(data.paidAmount)}</strong>
            </div>
            <div className={styles.debtRow}>
              <span>До сплати</span>
              <strong>{formatMoney(data.debt)}</strong>
            </div>
          </div>

          {data.payments.length > 0 && (
            <div>
              <h4 className={styles.subtitle}>Платежі</h4>
              <ul className={styles.items}>
                {data.payments.map((p) => (
                  <li key={p.id}>
                    <span>
                      {p.paidAt ? formatDate(p.paidAt) : "-"}, {methodLabels[p.method]}
                    </span>
                    <strong>{formatMoney(p.amount)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <div className={styles.alert}>{error}</div>}

          {canPay && (
            <div className={styles.actions}>
              <PayButton invoiceId={data.id} amount={data.debt} onError={setError} />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}