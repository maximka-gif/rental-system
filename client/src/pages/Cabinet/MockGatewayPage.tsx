import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Lock, ShieldCheck } from "lucide-react";
import { Button } from "../../components/ui/Button/Button";
import { completeMockPayment, syncPayment } from "../../api/payments";
import { formatMoney } from "../../utils/format";
import styles from "./Cabinet.module.scss";

export function MockGatewayPage() {
  const { orderId = "" } = useParams();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<"pay" | "decline" | null>(null);
  const [error, setError] = useState("");

  const payment = useQuery({
    queryKey: ["mock-payment", orderId],
    queryFn: () => syncPayment(orderId),
    retry: false,
  });

  async function finish(success: boolean) {
    setBusy(success ? "pay" : "decline");
    setError("");
    try {
      await completeMockPayment(orderId, success);
      navigate(`/my/pay/result?order=${orderId}`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося завершити платіж");
      setBusy(null);
    }
  }

  return (
    <div className={styles.gatewayPage}>
      <div className={styles.gatewayCard}>
        <div className={styles.gatewayHead}>
          <ShieldCheck size={22} />
          <span>Тестовий платіжний шлюз</span>
        </div>

        {payment.isLoading && <p>Завантаження...</p>}

        {payment.isError && (
          <div className={styles.alert}>
            {payment.error instanceof Error ? payment.error.message : "Платіж не знайдено"}
          </div>
        )}

        {payment.data && payment.data.status !== "PENDING" && (
          <>
            <p>Цей платіж уже оброблено.</p>
            <Button fullWidth onClick={() => navigate(`/my/pay/result?order=${orderId}`)}>
              Переглянути результат
            </Button>
          </>
        )}

        {payment.data && payment.data.status === "PENDING" && (
          <>
            <div className={styles.gatewayAmount}>
              <span>Рахунок {payment.data.invoiceNumber}</span>
              <strong>{formatMoney(payment.data.amount)}</strong>
            </div>

            <p className={styles.muted}>
              Це імітація сторінки банку для демонстрації. Реальні гроші не списуються, оберіть результат
              платежу.
            </p>

            {error && <div className={styles.alert}>{error}</div>}

            <Button fullWidth loading={busy === "pay"} disabled={busy !== null} onClick={() => finish(true)}>
              <Lock size={16} />
              Оплатити {formatMoney(payment.data.amount)}
            </Button>
            <Button
              fullWidth
              variant="secondary"
              loading={busy === "decline"}
              disabled={busy !== null}
              onClick={() => finish(false)}
            >
              Відхилити платіж
            </Button>
          </>
        )}
      </div>
    </div>
  );
}