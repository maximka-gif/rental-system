import { useState } from "react";
import { FileText, Plus, Search } from "lucide-react";
import { Button } from "../../components/ui/Button/Button";
import { Badge } from "../../components/ui/Badge/Badge";
import { Modal } from "../../components/ui/Modal/Modal";
import { Table } from "../../components/ui/Table/Table";
import { CellMain, Money } from "../../components/ui/Table/TableParts";
import { useDebounce } from "../../hooks/useDebounce";
import { useDeleteLease, useLeases } from "../../hooks/useLeases";
import type { Lease, LeaseStatus } from "../../api/leases";
import { formatDate } from "../../utils/format";
import { leaseView } from "./leaseView";
import { LeaseFormModal } from "./LeaseFormModal";
import { LeaseDetailsModal } from "./LeaseDetailsModal";
import { cn } from "../../utils/cn";
import styles from "../Properties/Properties.module.scss";

const filterOptions: { value: LeaseStatus | ""; label: string }[] = [
  { value: "", label: "Усі" },
  { value: "ACTIVE", label: "Діють" },
  { value: "DRAFT", label: "Чернетки" },
  { value: "EXPIRED", label: "Завершені" },
  { value: "TERMINATED", label: "Розірвані" },
];

export function LeasesPage() {
  const [status, setStatus] = useState<LeaseStatus | "">("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError } = useLeases({ status, search: debouncedSearch });
  const remove = useDeleteLease();

  const [selected, setSelected] = useState<Lease | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lease | null>(null);
  const [deleting, setDeleting] = useState<Lease | null>(null);
  const [deleteError, setDeleteError] = useState("");

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(lease: Lease) {
    setSelected(null);
    setEditing(lease);
    setFormOpen(true);
  }

  function askDelete(lease: Lease) {
    setDeleteError("");
    setDeleting(lease);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }

    try {
      await remove.mutateAsync(deleting.id);
      setDeleting(null);
      setSelected(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Не вдалося видалити");
    }
  }

  function emptyText() {
    if (isLoading) {
      return "Завантаження...";
    }
    if (isError) {
      return "Не вдалося завантажити договори";
    }
    if (status || debouncedSearch) {
      return "За вашим запитом нічого не знайдено";
    }
    return "Ще немає договорів. Натисніть «Новий договір», щоб створити перший.";
  }

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>Договори</h1>
          <p className={styles.muted}>{data ? `Знайдено: ${data.length}` : " "}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} />
          Новий договір
        </Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={17} />
          <input
            placeholder="Пошук за номером, об'єктом чи орендарем"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
        rows={data ?? []}
        getRowKey={(r) => r.id}
        getRowTone={(r) => leaseView(r).tone}
        onRowClick={(r) => setSelected(r)}
        emptyText={emptyText()}
        columns={[
          {
            header: "Договір",
            render: (r) => (
              <CellMain icon={<FileText size={20} />} title={r.number} subtitle={r.property.title} />
            ),
          },
          { header: "Орендар", render: (r) => r.tenant.name },
          { header: "Період", render: (r) => `${formatDate(r.startDate)} - ${formatDate(r.endDate)}` },
          { header: "Оренда / міс", align: "right", render: (r) => <Money value={r.rentAmount} /> },
          {
            header: "Статус",
            render: (r) => {
              const view = leaseView(r);
              return (
                <Badge tone={view.tone} icon={view.icon}>
                  {view.label}
                </Badge>
              );
            },
          },
        ]}
      />

      <LeaseDetailsModal
        lease={selected}
        onClose={() => setSelected(null)}
        onUpdated={setSelected}
        onEdit={openEdit}
        onDelete={askDelete}
      />

      <LeaseFormModal open={formOpen} lease={editing} onClose={() => setFormOpen(false)} />

      <Modal open={deleting !== null} title="Видалити чернетку?" onClose={() => setDeleting(null)}>
        <div className={styles.confirm}>
          <p>Чернетку договору {deleting?.number} буде видалено. Цю дію не можна скасувати.</p>
          {deleteError && <div className={styles.alert}>{deleteError}</div>}
          <div className={styles.footer}>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Скасувати
            </Button>
            <Button variant="danger" loading={remove.isPending} onClick={confirmDelete}>
              Видалити
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}