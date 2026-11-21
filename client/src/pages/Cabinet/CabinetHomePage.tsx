import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, MapPin } from "lucide-react";
import { Badge } from "../../components/ui/Badge/Badge";
import { Card } from "../../components/ui/Card/Card";
import { fileUrl } from "../../api/client";
import { useCabinetSummary } from "../../hooks/useCabinet";
import { formatDate, formatMoney, monthLabel } from "../../utils/format";
import { invoiceView } from "../Payments/invoiceView";
import { PayButton } from "./PayButton";
import { cn } from "../../utils/cn";
import styles from "./Cabinet.module.scss";

export function CabinetHomePage() {
  const { data, isLoading, isError } = useCabinetSummary();
  const [error, setError] = useState("");

  if (isLoading) {
    return <p>Завантаження...</p>;
  }

  if (isError || !data) {
    return <p>Не вдалося завантажити дані кабінету.</p>;
  }

  const { lease, nextInvoice } = data;
  const view = nextInvoice ? invoiceView[nextInvoice.status] : null;

  return (
    <div className={styles.page}>
      <div>
        <h1>Вітаємо, {data.tenant.firstName}!</h1>
        <p className={styles.muted}>Ваш договір, рахунки й платежі в одному місці</p>
      </div>

      <div className={styles.stats}>
        <div className={cn(styles.stat, data.debt > 0 && styles.statDebt)}>
          <span>До сплати</span>
          <strong>{formatMoney(data.debt)}</strong>
        </div>
        <div className={styles.stat}>
          <span>Найближчий платіж</span>
          <strong>{nextInvoice ? formatDate(nextInvoice.dueDate) : "Немає"}</strong>
        </div>
        <div className={styles.stat}>
          <span>Оренда на місяць</span>
          <strong>{lease ? formatMoney(lease.rentAmount) : "-"}</strong>
        </div>
      </div>

      {nextInvoice && view && (
        <Card className={cn(styles.banner, nextInvoice.status === "OVERDUE" && styles.bannerOverdue)}>
          <div className={styles.bannerText}>
            <div className={styles.bannerTop}>
              <h3>Рахунок за {monthLabel(nextInvoice.periodStart).toLowerCase()}</h3>
              <Badge tone={view.tone} icon={view.icon} pulse={view.pulse}>
                {view.label}
              </Badge>
            </div>
            <p className={styles.muted}>
              Оплатити до {formatDate(nextInvoice.dueDate)}. Рахунок {nextInvoice.number}.
            </p>
            {error && <div className={styles.alert}>{error}</div>}
          </div>
          <PayButton invoiceId={nextInvoice.id} amount={nextInvoice.debt} onError={setError} />
        </Card>
      )}

      {!nextInvoice && lease && (
        <Card className={styles.allPaid}>
          <h3>Усе сплачено</h3>
          <p className={styles.muted}>Неоплачених рахунків немає. Дякуємо!</p>
        </Card>
      )}

      {lease ? (
        <Card className={styles.leaseCard}>
          <div className={styles.photo}>
            {lease.property.coverUrl ? (
              <img src={fileUrl(lease.property.coverUrl)} alt={lease.property.title} />
            ) : (
              <Building2 size={40} />
            )}
          </div>
          <div className={styles.leaseBody}>
            <span className={styles.muted}>Договір {lease.number}</span>
            <h2>{lease.property.title}</h2>
            <p className={styles.address}>
              <MapPin size={15} />
              {lease.property.city}, {lease.property.address}
            </p>
            <p className={styles.muted}>
              Діє з {formatDate(lease.startDate)} до {formatDate(lease.endDate)}
            </p>
            <Link to="/my/lease">Подробиці договору</Link>
          </div>
        </Card>
      ) : (
        <Card>
          <h3>Активного договору немає</h3>
          <p className={styles.muted}>Зверніться до власника житла, щоб він оформив договір.</p>
        </Card>
      )}
    </div>
  );
}