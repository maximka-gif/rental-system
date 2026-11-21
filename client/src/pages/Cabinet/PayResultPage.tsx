import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, CircleX, Clock } from "lucide-react";
import { Button } from "../../components/ui/Button/Button";
import { Card } from "../../components/ui/Card/Card";
import { syncPayment } from "../../api/payments";
import { formatMoney } from "../../utils/format";
import styles from "./Cabinet.module.scss";

export function PayResultPage() {
  const [params] = useSearchParams();
  const orderId = params.get("order") ?? "";
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["pay-result", orderId],
    queryFn: () => syncPayment(orderId),
    enabled: orderId !== "",
    retry: false,
    refetchInterval: (query) => (query.state.data?.status === "PENDING" ? 3000 : false),
  });

  // після успішної оплати оновлюємо дані кабінету
  useEffect(() => {
    if (data?.status === "SUCCESS") {
      queryClient.invalidateQueries({ queryKey: ["cabinet"] });
    }
  }, [data?.status, queryClient]);

  return (
    <div className={styles.page}>
      <Card className={styles.result}>
        {isLoading && <p>Перевіряємо платіж...</p>}

        {(isError || orderId === "") && (
          <>
            <CircleX size={56} className={styles.iconFail} />
            <h2>Платіж не знайдено</h2>
          </>
        )}

        {data && data.status === "SUCCESS" && (
          <>
            <CircleCheck size={56} className={styles.iconOk} />
            <h2>Оплату прийнято</h2>
            <p className={styles.muted}>
              Рахунок {data.invoiceNumber}, сплачено {formatMoney(data.amount)}. Дякуємо!
            </p>
          </>
        )}

        {data && data.status === "FAILED" && (
          <>
            <CircleX size={56} className={styles.iconFail} />
            <h2>Платіж не пройшов</h2>
            <p className={styles.muted}>Гроші не списано. Спробуйте оплатити ще раз.</p>
          </>
        )}

        {data && data.status === "PENDING" && (
          <>
            <Clock size={56} className={styles.iconWait} />
            <h2>Очікуємо підтвердження</h2>
            <p className={styles.muted}>Банк ще обробляє платіж. Сторінка оновиться сама.</p>
          </>
        )}

        <div className={styles.resultActions}>
          <Link to="/my/invoices">
            <Button>Мої рахунки</Button>
          </Link>
          <Link to="/my">
            <Button variant="secondary">На головну</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}