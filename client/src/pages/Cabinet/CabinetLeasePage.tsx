import { Building2 } from "lucide-react";
import { Card } from "../../components/ui/Card/Card";
import { fileUrl } from "../../api/client";
import { useCabinetSummary } from "../../hooks/useCabinet";
import { formatDate, formatMoney } from "../../utils/format";
import styles from "./Cabinet.module.scss";

export function CabinetLeasePage() {
  const { data, isLoading, isError } = useCabinetSummary();

  if (isLoading) {
    return <p>Завантаження...</p>;
  }

  if (isError || !data) {
    return <p>Не вдалося завантажити договір.</p>;
  }

  const lease = data.lease;

  if (!lease) {
    return (
      <div className={styles.page}>
        <h1>Мій договір</h1>
        <Card>
          <h3>Активного договору немає</h3>
          <p className={styles.muted}>Зверніться до власника житла, щоб він оформив договір.</p>
        </Card>
      </div>
    );
  }

  const terms = [
    { label: "Номер договору", value: lease.number },
    { label: "Період", value: `${formatDate(lease.startDate)} - ${formatDate(lease.endDate)}` },
    { label: "Оренда на місяць", value: formatMoney(lease.rentAmount) },
    { label: "Завдаток", value: formatMoney(lease.depositAmount) },
    { label: "Оплата до", value: `${lease.paymentDay} числа щомісяця` },
    { label: "Пеня за прострочення", value: `${lease.penaltyRatePerDay}% за день` },
    { label: "Індексація оренди", value: `${lease.indexationPercent}% на рік` },
  ];

  const property = lease.property;

  const details = [
    { label: "Адреса", value: `${property.city}, ${property.address}` },
    { label: "Площа", value: property.area ? `${property.area} м²` : "-" },
    { label: "Кімнат", value: property.rooms ?? "-" },
    { label: "Поверх", value: property.floor ?? "-" },
  ];

  return (
    <div className={styles.page}>
      <h1>Мій договір</h1>

      <Card className={styles.leaseCard}>
        <div className={styles.photo}>
          {property.coverUrl ? (
            <img src={fileUrl(property.coverUrl)} alt={property.title} />
          ) : (
            <Building2 size={40} />
          )}
        </div>
        <div className={styles.leaseBody}>
          <h2>{property.title}</h2>
          <dl className={styles.infoGrid}>
            {details.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      <Card>
        <h3>Умови договору</h3>
        <dl className={styles.infoGrid}>
          {terms.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}