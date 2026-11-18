import { useState } from "react";
import { Building2, Home, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button/Button";
import { Badge } from "../../components/ui/Badge/Badge";
import { Modal } from "../../components/ui/Modal/Modal";
import { Table } from "../../components/ui/Table/Table";
import {
  CellMain,
  Money,
  RowActions,
} from "../../components/ui/Table/TableParts";
import { useDebounce } from "../../hooks/useDebounce";
import { useDeleteProperty, useProperties } from "../../hooks/useProperties";
import type { PropertyListItem, PropertyStatus } from "../../api/properties";
import { PropertyFormModal } from "./PropertyFormModal";
import { useNavigate } from "react-router-dom";
import { statusView } from "./statusView";
import { fileUrl } from "../../api/client";
import { cn } from "../../utils/cn";
import styles from "./Properties.module.scss";

const filterOptions: { value: PropertyStatus | ""; label: string }[] = [
  { value: "", label: "Усі" },
  { value: "RENTED", label: "Здано" },
  { value: "VACANT", label: "Вільно" },
  { value: "MAINTENANCE", label: "Ремонт" },
];

export function PropertiesPage() {
  const [status, setStatus] = useState<PropertyStatus | "">("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError } = useProperties({
    status,
    search: debouncedSearch,
  });
  const remove = useDeleteProperty();
  const navigate = useNavigate();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyListItem | null>(null);
  const [deleting, setDeleting] = useState<PropertyListItem | null>(null);
  const [deleteError, setDeleteError] = useState("");

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(property: PropertyListItem) {
    setEditing(property);
    setFormOpen(true);
  }

  function askDelete(property: PropertyListItem) {
    setDeleteError("");
    setDeleting(property);
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
      return "Не вдалося завантажити об'єкти";
    }
    if (status || debouncedSearch) {
      return "За вашим запитом нічого не знайдено";
    }
    return "Ще немає жодного об'єкта. Натисніть «Додати об'єкт», щоб створити перший.";
  }

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>Об'єкти нерухомості</h1>
          <p className={styles.muted}>
            {data ? `Знайдено: ${data.length}` : " "}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} />
          Додати об'єкт
        </Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={17} />
          <input
            placeholder="Пошук за назвою чи адресою"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.chips}>
          {filterOptions.map((option) => (
            <button
              key={option.value}
              className={cn(
                styles.chip,
                status === option.value && styles.chipActive,
              )}
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
        getRowTone={(r) => statusView[r.status].tone}
        emptyText={emptyText()}
        onRowClick={(r) => navigate(`/properties/${r.id}`)}
        columns={[
          {
            header: "Об'єкт",
            render: (r) => (
              <CellMain
                icon={
                  r.coverUrl ? (
                    <img
                      src={fileUrl(r.coverUrl)}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : r.type === "HOUSE" ? (
                    <Home size={20} />
                  ) : (
                    <Building2 size={20} />
                  )
                }
                title={r.title}
                subtitle={r.address}
              />
            ),
          },
          { header: "Орендар", render: (r) => r.tenant ?? "-" },
          {
            header: "Оренда / міс",
            align: "right",
            render: (r) => <Money value={r.rent ?? r.baseRent} />,
          },
          {
            header: "Статус",
            render: (r) => (
              <Badge
                tone={statusView[r.status].tone}
                icon={statusView[r.status].icon}
              >
                {statusView[r.status].label}
              </Badge>
            ),
          },
          {
            header: "",
            align: "right",
            render: (r) => (
              <RowActions>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Редагувати"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(r);
                  }}
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Видалити"
                  onClick={(e) => {
                    e.stopPropagation();
                    askDelete(r);
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </RowActions>
            ),
          },
        ]}
      />

      <PropertyFormModal
        open={formOpen}
        property={editing}
        onClose={() => setFormOpen(false)}
      />

      <Modal
        open={deleting !== null}
        title="Видалити об'єкт?"
        onClose={() => setDeleting(null)}
      >
        <div className={styles.confirm}>
          <p>
            Ви збираєтеся видалити «{deleting?.title}». Цю дію не можна
            скасувати.
          </p>
          {deleteError && <div className={styles.alert}>{deleteError}</div>}
          <div className={styles.footer}>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Скасувати
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={confirmDelete}
            >
              Видалити
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
