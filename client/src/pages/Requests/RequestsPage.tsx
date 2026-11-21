import { useState } from "react";
import { Search } from "lucide-react";
import { Select } from "../../components/ui/Select/Select";
import { useDebounce } from "../../hooks/useDebounce";
import { useProperties } from "../../hooks/useProperties";
import { useRequests } from "../../hooks/useRequests";
import type { RequestStatus } from "../../api/requests";
import { RequestCard } from "./RequestCard";
import { RequestDetailsModal } from "./RequestDetailsModal";
import { requestStatusView } from "./requestView";
import styles from "../Properties/Properties.module.scss";
import local from "./Requests.module.scss";

const columns: RequestStatus[] = ["NEW", "IN_PROGRESS", "DONE", "REJECTED"];

export function RequestsPage() {
  const [propertyId, setPropertyId] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError } = useRequests({ status: "", propertyId, search: debouncedSearch });
  const properties = useProperties({ status: "", search: "" });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = data ?? [];
  const open = rows.filter((r) => r.status === "NEW" || r.status === "IN_PROGRESS").length;

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>Заявки на ремонт</h1>
          <p className={styles.muted}>{data ? `Усього: ${rows.length}, відкритих: ${open}` : " "}</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={17} />
          <input
            placeholder="Пошук за назвою чи описом"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={local.propertySelect}>
          <Select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            <option value="">Усі об'єкти</option>
            {properties.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading && <p>Завантаження...</p>}
      {isError && <div className={local.alert}>Не вдалося завантажити заявки</div>}

      <div className={local.board}>
        {columns.map((status) => {
          const view = requestStatusView[status];
          const items = rows.filter((r) => r.status === status);

          return (
            <section key={status} className={local.column} data-tone={view.tone}>
              <header className={local.columnHead}>
                <span className={local.columnTitle}>
                  <span className={local.dot} />
                  {view.columnTitle}
                </span>
                <span className={local.count}>{items.length}</span>
              </header>

              {items.length === 0 && <p className={local.emptyColumn}>Немає заявок</p>}

              {items.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  showTenant
                  onClick={() => setSelectedId(request.id)}
                />
              ))}
            </section>
          );
        })}
      </div>

      <RequestDetailsModal requestId={selectedId} role="OWNER" onClose={() => setSelectedId(null)} />
    </div>
  );
}