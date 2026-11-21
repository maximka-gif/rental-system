import { useState } from "react";
import { Receipt } from "lucide-react";
import { Badge } from "../../components/ui/Badge/Badge";
import { Table } from "../../components/ui/Table/Table";
import { CellMain, Money } from "../../components/ui/Table/TableParts";
import { useCabinetInvoices } from "../../hooks/useCabinet";
import { formatDate, monthLabel } from "../../utils/format";
import { invoiceView } from "../Payments/invoiceView";
import { CabinetInvoiceModal } from "./CabinetInvoiceModal";
import { PayButton } from "./PayButton";
import styles from "./Cabinet.module.scss";

export function CabinetInvoicesPage() {
  const { data, isLoading, isError } = useCabinetInvoices();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function emptyText() {
    if (isLoading) {
      return "Завантаження...";
    }
    if (isError) {
      return "Не вдалося завантажити рахунки";
    }
    return "Рахунків ще немає";
  }

  return (
    <div className={styles.page}>
      <div>
        <h1>Мої рахунки</h1>
        <p className={styles.muted}>Історія нарахувань і оплат</p>
      </div>

      {error && <div className={styles.alert}>{error}</div>}

      <Table
        rows={data ?? []}
        getRowKey={(r) => r.id}
        getRowTone={(r) => invoiceView[r.status].tone}
        onRowClick={(r) => setSelectedId(r.id)}
        emptyText={emptyText()}
        columns={[
          {
            header: "Рахунок",
            render: (r) => (
              <CellMain icon={<Receipt size={20} />} title={monthLabel(r.periodStart)} subtitle={r.number} />
            ),
          },
          { header: "Оплатити до", render: (r) => formatDate(r.dueDate) },
          { header: "Сума", align: "right", render: (r) => <Money value={r.totalAmount} /> },
          {
            header: "Борг",
            align: "right",
            render: (r) => (r.debt > 0 ? <Money value={r.debt} /> : "-"),
          },
          {
            header: "Статус",
            render: (r) => {
              const view = invoiceView[r.status];
              return (
                <Badge tone={view.tone} icon={view.icon} pulse={view.pulse}>
                  {view.label}
                </Badge>
              );
            },
          },
          {
            header: "",
            align: "right",
            render: (r) => {
              if (r.status === "PAID" || r.status === "CANCELLED" || r.debt <= 0) {
                return null;
              }
              return (
                <div onClick={(e) => e.stopPropagation()}>
                  <PayButton size="sm" invoiceId={r.id} amount={r.debt} onError={setError} />
                </div>
              );
            },
          },
        ]}
      />

      <CabinetInvoiceModal invoiceId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}