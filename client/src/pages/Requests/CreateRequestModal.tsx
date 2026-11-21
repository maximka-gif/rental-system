import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, X } from "lucide-react";
import { Modal } from "../../components/ui/Modal/Modal";
import { Input } from "../../components/ui/Input/Input";
import { Select } from "../../components/ui/Select/Select";
import { Textarea } from "../../components/ui/Textarea/Textarea";
import { Button } from "../../components/ui/Button/Button";
import { useCreateRequest } from "../../hooks/useRequests";
import formStyles from "../Properties/Properties.module.scss";
import styles from "./Requests.module.scss";

const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024;

const schema = z.object({
  title: z.string().trim().min(1, "Вкажіть коротку назву проблеми"),
  description: z.string().trim().min(1, "Опишіть проблему"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
};

export function CreateRequestModal({ open, onClose, onDone }: Props) {
  const create = useCreateRequest();
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", priority: "MEDIUM" },
  });

  // попередній перегляд вибраних фото
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  useEffect(() => {
    if (open) {
      reset({ title: "", description: "", priority: "MEDIUM" });
      setFiles([]);
      setFileError("");
      setServerError("");
    }
  }, [open, reset]);

  function addFiles(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";

    setFileError("");
    const accepted: File[] = [];

    for (const file of picked) {
      if (!file.type.startsWith("image/")) {
        setFileError("Можна додавати лише зображення");
        continue;
      }
      if (file.size > MAX_SIZE) {
        setFileError("Файл завеликий (максимум 5 МБ)");
        continue;
      }
      accepted.push(file);
    }

    const merged = [...files, ...accepted];
    if (merged.length > MAX_FILES) {
      setFileError(`Максимум ${MAX_FILES} фото`);
    }
    setFiles(merged.slice(0, MAX_FILES));
  }

  function removeFile(index: number) {
    setFiles(files.filter((_, i) => i !== index));
  }

  async function onSubmit(values: FormValues) {
    setServerError("");

    const form = new FormData();
    form.append("title", values.title.trim());
    form.append("description", values.description.trim());
    form.append("priority", values.priority);
    for (const file of files) {
      form.append("photos", file);
    }

    try {
      await create.mutateAsync(form);
      onDone();
      onClose();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Не вдалося створити заявку");
    }
  }

  return (
    <Modal open={open} title="Нова заявка на ремонт" onClose={onClose}>
      <form className={styles.stack} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Що сталося"
          placeholder="Напр. Тече кран на кухні"
          error={errors.title?.message}
          {...register("title")}
        />

        <Textarea
          label="Опис проблеми"
          placeholder="Коли почалося, де саме, наскільки серйозно"
          error={errors.description?.message}
          {...register("description")}
        />

        <Select label="Наскільки це термінове" {...register("priority")}>
          <option value="LOW">Низький: може зачекати</option>
          <option value="MEDIUM">Звичайний</option>
          <option value="HIGH">Високий: заважає жити</option>
          <option value="URGENT">Терміново: аварія чи небезпека</option>
        </Select>

        <div>
          <span className={styles.fieldLabel}>Фото (до {MAX_FILES} шт.)</span>
          <div className={styles.previews}>
            {previews.map((url, index) => (
              <div key={url} className={styles.preview}>
                <img src={url} alt="" />
                <button type="button" aria-label="Прибрати фото" onClick={() => removeFile(index)}>
                  <X size={14} />
                </button>
              </div>
            ))}

            {files.length < MAX_FILES && (
              <label className={styles.addPhoto}>
                <ImagePlus size={20} />
                Додати
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={addFiles} />
              </label>
            )}
          </div>
          {fileError && <span className={styles.fieldError}>{fileError}</span>}
        </div>

        {serverError && <div className={styles.alert}>{serverError}</div>}

        <div className={formStyles.footer}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Скасувати
          </Button>
          <Button type="submit" loading={create.isPending}>
            Надіслати
          </Button>
        </div>
      </form>
    </Modal>
  );
}