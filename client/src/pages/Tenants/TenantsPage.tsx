import { useState } from "react";
import { Mail, Pencil, Plus, Search, Send, Trash2, UserCheck, UserX } from "lucide-react";
import { Button } from "../../components/ui/Button/Button";
import { Badge } from "../../components/ui/Badge/Badge";
import { Modal } from "../../components/ui/Modal/Modal";
import { Table } from "../../components/ui/Table/Table";
import { CellMain, RowActions } from "../../components/ui/Table/TableParts";
import { useDebounce } from "../../hooks/useDebounce";
import { useDeleteTenant, useTenants } from "../../hooks/useTenants";
import type { AccountStatus, TenantListItem } from "../../api/tenants";
import { TenantFormModal } from "./TenantFormModal";
import { InviteModal } from "./InviteModal";
import { cn } from "../../utils/cn";
import styles from "../Properties/Properties.module.scss";
import tenantStyles from "./Tenants.module.scss";

const accountView: Record<
  AccountStatus,
  { label: string; tone: "success" | "info" | "neutral"; icon: React.ReactNode }
> = {
  REGISTERED: { label: "Має акаунт", tone: "success", icon: <UserCheck size={13} /> },
  INVITED: { label: "Запрошено", tone: "info", icon: <Mail size={13} /> },
  NONE: { label: "Без акаунта", tone: "neutral", icon: <UserX size={13} /> },
};

function scoreLevel(score: number) {
  if (score >= 80) {
    return "high";
  }
  if (score >= 50) {
    return "mid";
  }
  return "low";
}

const scoreTone = { high: "success", mid: "warning", low: "danger" } as const;

function ReliabilityBar({ score }: { score: number }) {
  const level = scoreLevel(score);

  return (
    <div className={tenantStyles.score}>
      <div className={tenantStyles.track}>
        <div
          className={cn(tenantStyles.fill, tenantStyles[level])}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={tenantStyles.scoreValue}>{score}</span>
    </div>
  );
}

export function TenantsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError } = useTenants(debouncedSearch);
  const remove = useDeleteTenant();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TenantListItem | null>(null);
  const [inviting, setInviting] = useState<TenantListItem | null>(null);
  const [deleting, setDeleting] = useState<TenantListItem | null>(null);
  const [deleteError, setDeleteError] = useState("");

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(tenant: TenantListItem) {
    setEditing(tenant);
    setFormOpen(true);
  }

  function askDelete(tenant: TenantListItem) {
    setDeleteError("");
    setDeleting(tenant);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }

    try {
      await remove.mutateAsync(deleting.id);
      setDeleting(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Не вдалося видалити");
    }
  }

  function emptyText() {
    if (isLoading) {
      return "Завантаження...";
    }
    if (isError) {
      return "Не вдалося завантажити орендарів";
    }
    if (debouncedSearch) {
      return "За вашим запитом нічого не знайдено";
    }
    return "Ще немає орендарів. Натисніть «Додати орендаря», щоб створити першого.";
  }

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>Орендарі</h1>
          <p className={styles.muted}>{data ? `Усього: ${data.length}` : " "}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} />
          Додати орендаря
        </Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={17} />
          <input
            placeholder="Пошук за ім'ям чи email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Table
        rows={data ?? []}
        getRowKey={(r) => r.id}
        getRowTone={(r) => scoreTone[scoreLevel(r.reliabilityScore)]}
        emptyText={emptyText()}
        columns={[
          {
            header: "Орендар",
            render: (r) => (
              <CellMain
                icon={<strong>{r.firstName[0] + r.lastName[0]}</strong>}
                title={`${r.firstName} ${r.lastName}`}
                subtitle={r.email}
              />
            ),
          },
          { header: "Телефон", render: (r) => r.phone ?? "-" },
          { header: "Об'єкт", render: (r) => r.property ?? "-" },
          { header: "Надійність", render: (r) => <ReliabilityBar score={r.reliabilityScore} /> },
          {
            header: "Акаунт",
            render: (r) => (
              <Badge tone={accountView[r.accountStatus].tone} icon={accountView[r.accountStatus].icon}>
                {accountView[r.accountStatus].label}
              </Badge>
            ),
          },
          {
            header: "",
            align: "right",
            render: (r) => (
              <RowActions>
                {r.accountStatus !== "REGISTERED" && (
                  <Button variant="ghost" size="sm" aria-label="Запросити" title="Запросити" onClick={() => setInviting(r)}>
                    <Send size={16} />
                  </Button>
                )}
                <Button variant="ghost" size="sm" aria-label="Редагувати" onClick={() => openEdit(r)}>
                  <Pencil size={16} />
                </Button>
                <Button variant="ghost" size="sm" aria-label="Видалити" onClick={() => askDelete(r)}>
                  <Trash2 size={16} />
                </Button>
              </RowActions>
            ),
          },
        ]}
      />

      <TenantFormModal open={formOpen} tenant={editing} onClose={() => setFormOpen(false)} />
      <InviteModal tenant={inviting} onClose={() => setInviting(null)} />

      <Modal open={deleting !== null} title="Видалити орендаря?" onClose={() => setDeleting(null)}>
        <div className={styles.confirm}>
          <p>
            Ви збираєтеся видалити «{deleting?.firstName} {deleting?.lastName}». Цю дію не можна
            скасувати.
          </p>
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