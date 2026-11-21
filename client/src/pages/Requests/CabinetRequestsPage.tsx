import { useState } from "react";
import { Plus, Wrench } from "lucide-react";
import { Button } from "../../components/ui/Button/Button";
import { useRequests } from "../../hooks/useRequests";
import type { RequestStatus } from "../../api/requests";
import { RequestCard } from "./RequestCard";
import { RequestDetailsModal } from "./RequestDetailsModal";
import { CreateRequestModal } from "./CreateRequestModal";
import { cn } from "../../utils/cn";
import styles from "../Properties/Properties.module.scss";
import local from "./Requests.module.scss";

const filterOptions: { value: RequestStatus | ""; label: string }[] = [
  { value: "", label: "Усі" },
  { value: "NEW", label: "Нові" },
  { value: "IN_PROGRESS", label: "У роботі" },
  { value: "DONE", label: "Виконані" },
  { value: "REJECTED", label: "Відхилені" },
];

export function CabinetRequestsPage() {
  const [status, setStatus] = useState<RequestStatus | "">("");
  const { data, isLoading, isError } = useRequests({ status, propertyId: "", search: "" });

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const rows = data ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>Заявки на ремонт</h1>
          <p className={styles.muted}>Повідомте власника про несправність і стежте за ходом ремонту</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={18} />
          Нова заявка
        </Button>
      </div>

      {notice && <div className={local.success}>{notice}</div>}

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

      {isLoading && <p>Завантаження...</p>}
      {isError && <div className={local.alert}>Не вдалося завантажити заявки</div>}

      {data && rows.length === 0 && (
        <div className={local.emptyState}>
          <Wrench size={32} />
          <p>
            {status ? "За цим фільтром заявок немає" : "У вас ще немає заявок. Натисніть «Нова заявка», якщо щось зламалося."}
          </p>
        </div>
      )}

      <div className={local.cardGrid}>
        {rows.map((request) => (
          <RequestCard key={request.id} request={request} showStatus onClick={() => setSelectedId(request.id)} />
        ))}
      </div>

      <CreateRequestModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onDone={() => setNotice("Заявку надіслано. Власник отримає її й відповість у обговоренні.")}
      />

      <RequestDetailsModal requestId={selectedId} role="TENANT" onClose={() => setSelectedId(null)} />
    </div>
  );
}