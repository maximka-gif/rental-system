import { useEffect, useState } from "react";
import { Ban, Plus, Wallet } from "lucide-react";
import { Modal } from "../../components/ui/Modal/Modal";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { Select } from "../../components/ui/Select/Select";
import {
  useAddInvoiceItem,
  useCancelInvoice,
  useInvoice,
  useRecordPayment,
} from "../../hooks/useInvoices";
import { formatDate, formatMoney, todayString } from "../../utils/format";
import { invoiceView, methodLabels } from "./invoiceView";
import { cn } from "../../utils/cn";
import styles from "./Payments.module.scss";

type Mode = null | "item" | "payment" | "cancel";

type Props = {
  invoiceId: string | null;
  onClose: () => void;
};

export function InvoiceDetailsModal({ invoiceId, onClose }: Props) {
  const { data, isLoading, isError } = useInvoice(invoiceId);
  const addItem = useAddInvoiceItem();
  const pay = useRecordPayment();
  const cancel = useCancelInvoice();

  const [mode, setMode] = useState<Mode>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [itemType, setItemType] = useState<"UTILITIES" | "OTHER">("UTILITIES");
  const [itemDescription, setItemDescription] = useState("");
  const [itemAmount, setItemAmount] = useState("");

  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"CASH" | "BANK_TRANSFER">("CASH");
  const [payDate, setPayDate] = useState(todayString());

  useEffect(() => {
    setMode(null);
    setError("");
    setNotice("");
  }, [invoiceId]);

  function openMode(next: Mode) {
    setError("");
    setNotice("");

    if (next === "payment" && data) {
      setPayAmount(String(data.debt));
      setPayDate(todayString());
    }

    setMode(next);
  }

  async function submitItem() {
    if (!data) {
      return;
    }

    const amount = Number(itemAmount);
    if (itemDescription.trim() === "") {
      setError("Вкажіть опис позиції");
      return;
    }
    if (!(amount > 0)) {
      setError("Сума має бути більшою за 0");
      return;
    }

    setError("");
    try {
      await addItem.mutateAsync({
        id: data.id,
        data: { type: itemType, description: itemDescription.trim(), amount },
      });
      setMode(null);
      setItemDescription("");
      setItemAmount("");
      setNotice("Позицію додано до рахунку.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося додати позицію");
    }
  }

  async function submitPayment() {
    if (!data) {
      return;
    }

    const amount = Number(payAmount);
    if (!(amount > 0)) {
      setError("Сума має бути більшою за 0");
      return;
    }

    setError("");
    try {
      await pay.mutateAsync({ id: data.id, data: { amount, method: payMethod, paidAt: payDate } });
      setMode(null);
      setNotice("Платіж зараховано.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося провести платіж");
    }
  }

  async function submitCancel() {
    if (!data) {
      return;
    }

    setError("");
    try {
      await cancel.mutateAsync(data.id);
      setMode(null);
      setNotice("Рахунок скасовано.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося скасувати рахунок");
    }
  }

  const view = data ? invoiceView[data.status] : null;
  const successPayments = data ? data.payments.filter((p) => p.status === "SUCCESS") : [];
  const canAct = data ? data.status !== "PAID" && data.status !== "CANCELLED" : false;
  const canCancel = canAct && successPayments.length === 0;

  return (
    <Modal
      open={invoiceId !== null}
      title={data ? `Рахунок ${data.number}` : "Рахунок"}
      onClose={onClose}
    >
      {isLoading && <p>Завантаження...</p>}
      {isError && <div className={styles.alert}>Не вдалося завантажити рахунок</div>}

      {data && view && (
        <div className={styles.stack}>
          <div className={styles.topRow}>
            <Badge tone={view.tone} icon={view.icon} pulse={view.pulse}>
              {view.label}
            </Badge>
            <span className={styles.muted}>
              {data.property.title}, {data.tenant.name}
            </span>
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

          {successPayments.length > 0 && (
            <div>
              <h4 className={styles.subtitle}>Платежі</h4>
              <ul className={styles.items}>
                {successPayments.map((p) => (
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

          {mode === "item" && (
            <div className={styles.subForm}>
              <Select
                label="Тип"
                value={itemType}
                onChange={(e) => setItemType(e.target.value as "UTILITIES" | "OTHER")}
              >
                <option value="UTILITIES">Комунальні послуги</option>
                <option value="OTHER">Інше</option>
              </Select>
              <Input
                label="Опис"
                placeholder="Напр. Електроенергія за листопад"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
              />
              <Input
                label="Сума, грн"
                type="number"
                value={itemAmount}
                onChange={(e) => setItemAmount(e.target.value)}
              />
              <div className={styles.footer}>
                <Button variant="secondary" onClick={() => setMode(null)}>
                  Скасувати
                </Button>
                <Button loading={addItem.isPending} onClick={submitItem}>
                  Додати
                </Button>
              </div>
            </div>
          )}

          {mode === "payment" && (
            <div className={styles.subForm}>
              <Input
                label="Сума, грн"
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
              <Select
                label="Спосіб"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as "CASH" | "BANK_TRANSFER")}
              >
                <option value="CASH">Готівка</option>
                <option value="BANK_TRANSFER">Банківський переказ</option>
              </Select>
              <Input
                label="Дата платежу"
                type="date"
                max={todayString()}
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
              />
              <div className={styles.footer}>
                <Button variant="secondary" onClick={() => setMode(null)}>
                  Скасувати
                </Button>
                <Button loading={pay.isPending} onClick={submitPayment}>
                  Зарахувати
                </Button>
              </div>
            </div>
          )}

          {mode === "cancel" && (
            <div className={styles.subForm}>
              <p>Скасувати рахунок {data.number}? Цю дію не можна відмінити.</p>
              <div className={styles.footer}>
                <Button variant="secondary" onClick={() => setMode(null)}>
                  Ні
                </Button>
                <Button variant="danger" loading={cancel.isPending} onClick={submitCancel}>
                  Скасувати рахунок
                </Button>
              </div>
            </div>
          )}

          {notice && <div className={styles.success}>{notice}</div>}
          {error && <div className={styles.alert}>{error}</div>}

          {canAct && mode === null && (
            <div className={styles.actions}>
              {canCancel && (
                <Button variant="ghost" onClick={() => openMode("cancel")}>
                  <Ban size={16} />
                  Скасувати
                </Button>
              )}
              <Button variant="secondary" onClick={() => openMode("item")}>
                <Plus size={16} />
                Додати позицію
              </Button>
              <Button onClick={() => openMode("payment")}>
                <Wallet size={16} />
                Прийняти платіж
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}