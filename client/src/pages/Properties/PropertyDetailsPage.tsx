import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Pencil, Star, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button/Button";
import { Badge } from "../../components/ui/Badge/Badge";
import { Card } from "../../components/ui/Card/Card";
import { Table } from "../../components/ui/Table/Table";
import { Money } from "../../components/ui/Table/TableParts";
import { fileUrl } from "../../api/client";
import {
  useDeletePhoto,
  usePropertyDetails,
  useSetCover,
  useUploadPhotos,
} from "../../hooks/useProperties";
import type { PropertyDetails, PropertyListItem } from "../../api/properties";
import { PropertyFormModal } from "./PropertyFormModal";
import { statusView } from "./statusView";
import { cn } from "../../utils/cn";
import styles from "./PropertyDetails.module.scss";

const typeLabels = {
  APARTMENT: "Квартира",
  HOUSE: "Будинок",
  ROOM: "Кімната",
  COMMERCIAL: "Комерційне приміщення",
};

const leaseStatusView = {
  ACTIVE: { label: "Діє", tone: "success" },
  DRAFT: { label: "Чернетка", tone: "neutral" },
  EXPIRED: { label: "Закінчився", tone: "neutral" },
  TERMINATED: { label: "Розірваний", tone: "danger" },
} as const;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("uk-UA");
}

// форма редагування працює з типом зі списку, тому приводимо дані до нього
function toListItem(p: PropertyDetails): PropertyListItem {
  return { ...p, coverUrl: null, tenant: null, rent: null };
}

export function PropertyDetailsPage() {
  const { id = "" } = useParams();
  const { data, isLoading, isError } = usePropertyDetails(id);

  const upload = useUploadPhotos(id);
  const removePhoto = useDeletePhoto(id);
  const makeCover = useSetCover(id);

  const fileInput = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (isLoading) {
    return <p>Завантаження...</p>;
  }

  if (isError || !data) {
    return (
      <div className={styles.page}>
        <Link to="/properties" className={styles.back}>
          <ArrowLeft size={16} /> До списку об'єктів
        </Link>
        <p>Об'єкт не знайдено.</p>
      </div>
    );
  }

  const mainPhoto =
    data.photos.find((p) => p.id === activePhotoId) ??
    data.photos.find((p) => p.isCover) ??
    data.photos[0];

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const form = new FormData();
    for (const file of Array.from(files)) {
      form.append("photos", file);
    }

    setError("");
    try {
      await upload.mutateAsync(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити фото");
    }

    // дозволяє вибрати той самий файл ще раз
    e.target.value = "";
  }

  async function handleDelete(photoId: string) {
    setError("");
    try {
      await removePhoto.mutateAsync(photoId);
      setActivePhotoId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося видалити фото");
    }
  }

  const status = statusView[data.status];

  const info = [
    { label: "Тип", value: typeLabels[data.type] },
    { label: "Місто", value: data.city },
    { label: "Площа", value: data.area ? `${data.area} м²` : "-" },
    { label: "Кімнат", value: data.rooms ?? "-" },
    { label: "Поверх", value: data.floor ?? "-" },
  ];

  // валова прибутковість: річна оренда поділена на вартість придбання
  const yieldPercent = data.purchasePrice
    ? (((data.baseRent * 12) / data.purchasePrice) * 100).toFixed(1)
    : null;

  return (
    <div className={styles.page}>
      <Link to="/properties" className={styles.back}>
        <ArrowLeft size={16} /> До списку об'єктів
      </Link>

      <div className={styles.head}>
        <div>
          <h1>{data.title}</h1>
          <p className={styles.muted}>
            {data.city}, {data.address}
          </p>
        </div>
        <div className={styles.headActions}>
          <Badge tone={status.tone} icon={status.icon}>
            {status.label}
          </Badge>
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil size={16} />
            Редагувати
          </Button>
        </div>
      </div>

      <div className={styles.grid}>
        <section className={styles.gallery}>
          {mainPhoto ? (
            <img className={styles.mainPhoto} src={fileUrl(mainPhoto.url)} alt={data.title} />
          ) : (
            <div className={styles.emptyPhoto}>
              <ImagePlus size={32} />
              <p>Фото ще немає</p>
            </div>
          )}

          <div className={styles.thumbs}>
            {data.photos.map((photo) => (
              <div
                key={photo.id}
                className={cn(styles.thumb, photo.id === mainPhoto?.id && styles.thumbActive)}
              >
                <img src={fileUrl(photo.url)} alt="" onClick={() => setActivePhotoId(photo.id)} />
                {photo.isCover && <span className={styles.coverMark}>Обкладинка</span>}
                <div className={styles.thumbActions}>
                  {!photo.isCover && (
                    <button
                      aria-label="Зробити обкладинкою"
                      title="Зробити обкладинкою"
                      onClick={() => makeCover.mutate(photo.id)}
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button aria-label="Видалити фото" title="Видалити" onClick={() => handleDelete(photo.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            <button
              className={styles.addThumb}
              onClick={() => fileInput.current?.click()}
              disabled={upload.isPending}
            >
              <ImagePlus size={20} />
              {upload.isPending ? "Завантаження..." : "Додати фото"}
            </button>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={handleFiles}
          />

          {error && <div className={styles.alert}>{error}</div>}
        </section>

        <aside className={styles.side}>
          <Card className={styles.priceCard}>
            <span className={styles.muted}>Оренда на місяць</span>
            <Money value={data.baseRent} />
            {yieldPercent && (
              <span className={styles.muted}>Прибутковість близько {yieldPercent}% річних</span>
            )}
          </Card>

          <Card>
            <dl className={styles.info}>
              {info.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </aside>
      </div>

      {data.description && (
        <Card>
          <h3>Опис</h3>
          <p className={styles.description}>{data.description}</p>
        </Card>
      )}

      <section className={styles.leases}>
        <h2>Історія договорів</h2>
        <Table
          rows={data.leases}
          getRowKey={(l) => l.id}
          getRowTone={(l) => leaseStatusView[l.status].tone}
          emptyText="Для цього об'єкта ще немає договорів"
          columns={[
            { header: "Договір", render: (l) => l.number },
            { header: "Орендар", render: (l) => l.tenant },
            { header: "Період", render: (l) => `${formatDate(l.startDate)} - ${formatDate(l.endDate)}` },
            { header: "Оренда", align: "right", render: (l) => <Money value={l.rentAmount} /> },
            {
              header: "Статус",
              render: (l) => (
                <Badge tone={leaseStatusView[l.status].tone}>{leaseStatusView[l.status].label}</Badge>
              ),
            },
          ]}
        />
      </section>

      <PropertyFormModal open={editOpen} property={toListItem(data)} onClose={() => setEditOpen(false)} />
    </div>
  );
}