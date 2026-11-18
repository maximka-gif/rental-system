import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "../../components/ui/Modal/Modal";
import { Input } from "../../components/ui/Input/Input";
import { Select } from "../../components/ui/Select/Select";
import { Textarea } from "../../components/ui/Textarea/Textarea";
import { Button } from "../../components/ui/Button/Button";
import { useSaveProperty } from "../../hooks/useProperties";
import type { PropertyListItem } from "../../api/properties";
import styles from "./Properties.module.scss";

const schema = z.object({
  title: z.string().min(1, "Вкажіть назву"),
  type: z.enum(["APARTMENT", "HOUSE", "ROOM", "COMMERCIAL"]),
  status: z.enum(["VACANT", "RENTED", "MAINTENANCE"]),
  city: z.string().min(1, "Вкажіть місто"),
  address: z.string().min(1, "Вкажіть адресу"),
  area: z.string(),
  rooms: z.string(),
  floor: z.string(),
  description: z.string(),
  baseRent: z
    .string()
    .min(1, "Вкажіть ціну оренди")
    .refine((v) => Number(v) > 0, "Ціна має бути більшою за 0"),
  purchasePrice: z.string(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  title: "",
  type: "APARTMENT",
  status: "VACANT",
  city: "Чернівці",
  address: "",
  area: "",
  rooms: "",
  floor: "",
  description: "",
  baseRent: "",
  purchasePrice: "",
};

function toFormValues(p: PropertyListItem): FormValues {
  return {
    title: p.title,
    type: p.type,
    status: p.status,
    city: p.city,
    address: p.address,
    area: p.area === null ? "" : String(p.area),
    rooms: p.rooms === null ? "" : String(p.rooms),
    floor: p.floor === null ? "" : String(p.floor),
    description: p.description ?? "",
    baseRent: String(p.baseRent),
    purchasePrice: p.purchasePrice === null ? "" : String(p.purchasePrice),
  };
}

function numberOrNull(value: string) {
  if (value.trim() === "") {
    return null;
  }
  return Number(value);
}

type Props = {
  open: boolean;
  property: PropertyListItem | null;
  onClose: () => void;
};

export function PropertyFormModal({ open, property, onClose }: Props) {
  const save = useSaveProperty();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  // при кожному відкритті заповнюємо форму: даними об'єкта або порожніми значеннями
  useEffect(() => {
    if (open) {
      reset(property ? toFormValues(property) : emptyValues);
      setServerError("");
    }
  }, [open, property, reset]);

  async function onSubmit(values: FormValues) {
    setServerError("");

    const description = values.description.trim();

    const data = {
      title: values.title.trim(),
      type: values.type,
      status: values.status,
      city: values.city.trim(),
      address: values.address.trim(),
      area: numberOrNull(values.area),
      rooms: numberOrNull(values.rooms),
      floor: numberOrNull(values.floor),
      description: description === "" ? null : description,
      baseRent: Number(values.baseRent),
      purchasePrice: numberOrNull(values.purchasePrice),
    };

    try {
      await save.mutateAsync({ id: property?.id, data });
      onClose();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Не вдалося зберегти");
    }
  }

  return (
    <Modal open={open} title={property ? "Редагувати об'єкт" : "Новий об'єкт"} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.full}>
          <Input label="Назва" placeholder="Напр. 2-кімн. квартира в центрі" error={errors.title?.message} {...register("title")} />
        </div>

        <Select label="Тип" {...register("type")}>
          <option value="APARTMENT">Квартира</option>
          <option value="HOUSE">Будинок</option>
          <option value="ROOM">Кімната</option>
          <option value="COMMERCIAL">Комерційне приміщення</option>
        </Select>

        <Select label="Статус" {...register("status")}>
          <option value="VACANT">Вільно</option>
          <option value="RENTED">Здано</option>
          <option value="MAINTENANCE">Ремонт</option>
        </Select>

        <Input label="Місто" error={errors.city?.message} {...register("city")} />
        <Input label="Адреса" placeholder="вул. Руська, 30, кв. 2" error={errors.address?.message} {...register("address")} />

        <Input label="Площа, м²" type="number" step="0.1" error={errors.area?.message} {...register("area")} />
        <Input label="Кімнат" type="number" error={errors.rooms?.message} {...register("rooms")} />

        <Input label="Поверх" type="number" error={errors.floor?.message} {...register("floor")} />
        <Input label="Оренда на місяць, грн" type="number" error={errors.baseRent?.message} {...register("baseRent")} />

        <div className={styles.full}>
          <Input
            label="Вартість придбання, грн (для рентабельності)"
            type="number"
            error={errors.purchasePrice?.message}
            {...register("purchasePrice")}
          />
        </div>

        <div className={styles.full}>
          <Textarea label="Опис" error={errors.description?.message} {...register("description")} />
        </div>

        {serverError && <div className={`${styles.alert} ${styles.full}`}>{serverError}</div>}

        <div className={`${styles.footer} ${styles.full}`}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Скасувати
          </Button>
          <Button type="submit" loading={save.isPending}>
            Зберегти
          </Button>
        </div>
      </form>
    </Modal>
  );
}