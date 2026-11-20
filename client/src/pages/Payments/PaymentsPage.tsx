import { useMemo, useState } from "react";
import { Plus, Receipt, RefreshCw, Search } from "lucide-react";
import { Button } from "../../components/ui/Button/Button";
import { Badge } from "../../components/ui/Badge/Badge";
import { Select } from "../../components/ui/Select/Select";
import { Table } from "../../components/ui/Table/Table";
import { CellMain, Money } from "../../components/ui/Table/TableParts";
import { useDebounce } from "../../hooks/useDebounce";
import { useInvoices, useRecalculateInvoices } from "../../hooks/useInvoices";
import type { InvoiceStatus } from "../../api/invoices";
import { formatDate, formatMoney, monthLabel, monthOptions } from "../../utils/format";
import { invoiceView } from "./invoiceView";
import { GenerateModal } from "./GenerateModal";
import { InvoiceDetailsModal } from "./InvoiceDetailsModal";
import { cn } from "../../utils/cn";
import styles from "../Properties/Properties.module.scss";
import local from "./Payments.module.scss";

const filterOptions: { value: InvoiceStatus | ""; label: string }[] = [
  { value: "", label: "Усі" },
  { value: "OVERDUE", label: "Прострочені" },
  { value: "PENDING", label: "Очікують" },
  { value: "PARTIAL", label: "Частково" },
  { value: "PAID", label: "Сплачені" },
  { value: "CANCELLED", label: "Скасовані" },
];

const round = (value: number) => Math.round(value * 100) / 100;

export function PaymentsPage() {
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [month, setMonth] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError } = useInvoices({ status, month, search: debouncedSearch });
  const recalculate = useRecalculateInvoices();
  const months = useMemo(() => monthOptions(), []);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const rows = data ?? [];
  const counted = rows.filter((r) => r.status !== "CANCELLED");
  const billed = round(counted.reduce((sum, r) => sum + r.totalAmount, 0));
  const paid = round(counted.reduce((sum, r) => sum + r.paidAmount, 0));
  const debt = round(counted.reduce((sum, r) => sum + r.debt, 0));

  async function handleRecalculate() {
    setNotice("");
    try {
      const result = await recalculate.mutateAsync();
      setNotice(`Пеню перераховано для рахунків: ${result.processed}.`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Не вдалося перерахувати пеню");
    }
  }

  function emptyText() {
    if (isLoading) {
      return "Завантаження...";
    }
    if (isError) {
      return "Не вдалося завантажити рахунки";
    }
    if (status || month || debouncedSearch) {
      return "За вашим запитом нічого не знайдено";
    }
    return "Ще немає рахунків. Натисніть «Створити рахунки», щоб виставити перші.";
  }

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>Платежі</h1>
          <p className={styles.muted}>{data ? `Рахунків: ${rows.length}` : " "}</p>
        </div>
        <div className={local.headActions}>
          <Button variant="secondary" loading={recalculate.isPending} onClick={handleRecalculate}>
            <RefreshCw size={16} />
            Перерахувати пеню
          </Button>
          <Button onClick={() => setGenerateOpen(true)}>
            <Plus size={18} />
            Створити рахунки
          </Button>
        </div>
      </div>

      <div className={local.stats}>
        <div className={local.stat}>
          <span>Нараховано</span>
          <strong>{formatMoney(billed)}</strong>
        </div>
        <div className={local.stat}>
          <span>Сплачено</span>
          <strong>{formatMoney(paid)}</strong>
        </div>
        <div className={cn(local.stat, debt > 0 && local.statDebt)}>
          <span>Заборгованість</span>
          <strong>{formatMoney(debt)}</strong>
        </div>
      </div>

      {notice && <div className={local.success}>{notice}</div>}

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={17} />
          <input
            placeholder="Пошук за номером, об'єктом чи орендарем"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={local.monthSelect}>
          <Select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">Усі місяці</option>
            {months.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>

        <div className={styles.chips}>
          {filterOptions.map((option) => (
            <button
              key={option.value}
              className={cn(styles.chip, status === option.value && styles.chipActive)}
              onClick={() => setStatus(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <Table
        rows={rows}
        getRowKey={(r) => r.id}
        getRowTone={(r) => invoiceView[r.status].tone}
        onRowClick={(r) => setSelectedId(r.id)}
        emptyText={emptyText()}
        columns={[
          {
            header: "Рахунок",
            render: (r) => (
              <CellMain icon={<Receipt size={20} />} title={r.number} subtitle={r.property.title} />
            ),
          },
          { header: "Орендар", render: (r) => r.tenant.name },
          { header: "Період", render: (r) => monthLabel(r.periodStart) },
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
        ]}
      />

      <GenerateModal open={generateOpen} onClose={() => setGenerateOpen(false)} onDone={setNotice} />
      <InvoiceDetailsModal invoiceId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}