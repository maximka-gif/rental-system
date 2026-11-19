import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "../../components/ui/Modal/Modal";
import { Input } from "../../components/ui/Input/Input";
import { Select } from "../../components/ui/Select/Select";
import { Textarea } from "../../components/ui/Textarea/Textarea";
import { Button } from "../../components/ui/Button/Button";
import { useSaveLease } from "../../hooks/useLeases";
import { useProperties } from "../../hooks/useProperties";
import { useTenants } from "../../hooks/useTenants";
import type { Lease } from "../../api/leases";
import formStyles from "../Properties/Properties.module.scss";
import styles from "./Leases.module.scss";

function inRange(min: number, max: number) {
  return (value: string) => {
    const n = Number(value);
    return value.trim() !== "" && n >= min && n <= max;
  };
}

const schema = z
  .object({
    propertyId: z.string().min(1, "Оберіть об'єкт"),
    tenantId: z.string().min(1, "Оберіть орендаря"),
    startDate: z.string().min(1, "Вкажіть дату початку"),
    endDate: z.string().min(1, "Вкажіть дату закінчення"),
    rentAmount: z
      .string()
      .min(1, "Вкажіть суму оренди")
      .refine((v) => Number(v) > 0, "Сума має бути більшою за 0"),
    depositAmount: z.string(),
    paymentDay: z.string().refine(inRange(1, 28), "Число від 1 до 28"),
    penaltyRatePerDay: z.string().refine(inRange(0, 5), "Значення від 0 до 5"),
    indexationPercent: z.string().refine(inRange(0, 100), "Значення від 0 до 100"),
    autoRenew: z.boolean(),
    notes: z.string(),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate > v.startDate, {
    message: "Дата закінчення має бути пізніше за початок",
    path: ["endDate"],
  });

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  propertyId: "",
  tenantId: "",
  startDate: "",
  endDate: "",
  rentAmount: "",
  depositAmount: "",
  paymentDay: "5",
  penaltyRatePerDay: "0.1",
  indexationPercent: "0",
  autoRenew: false,
  notes: "",
};

function toFormValues(l: Lease): FormValues {
  return {
    propertyId: l.property.id,
    tenantId: l.tenant.id,
    startDate: l.startDate.slice(0, 10),
    endDate: l.endDate.slice(0, 10),
    rentAmount: String(l.rentAmount),
    depositAmount: String(l.depositAmount),
    paymentDay: String(l.paymentDay),
    penaltyRatePerDay: String(l.penaltyRatePerDay),
    indexationPercent: String(l.indexationPercent),
    autoRenew: l.autoRenew,
    notes: l.notes ?? "",
  };
}

type Props = {
  open: boolean;
  lease: Lease | null;
  onClose: () => void;
};

export function LeaseFormModal({ open, lease, onClose }: Props) {
  const save = useSaveLease();
  const properties = useProperties({ status: "", search: "" });
  const tenants = useTenants("");
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) {
      reset(lease ? toFormValues(lease) : emptyValues);
      setServerError("");
    }
  }, [open, lease, reset]);

  // при виборі об'єкта в новому договорі підставляємо його ціну як оренду й завдаток
  function fillRent(propertyId: string) {
    if (lease) {
      return;
    }

    const property = properties.data?.find((p) => p.id === propertyId);
    if (property) {
      setValue("rentAmount", String(property.baseRent));
      setValue("depositAmount", String(property.baseRent));
    }
  }

  async function onSubmit(values: FormValues) {
    setServerError("");

    const notes = values.notes.trim();

    const data = {
      propertyId: values.propertyId,
      tenantId: values.tenantId,
      startDate: values.startDate,
      endDate: values.endDate,
      rentAmount: Number(values.rentAmount),
      depositAmount: Number(values.depositAmount || 0),
      paymentDay: Number(values.paymentDay),
      penaltyRatePerDay: Number(values.penaltyRatePerDay),
      indexationPercent: Number(values.indexationPercent),
      autoRenew: values.autoRenew,
      notes: notes === "" ? null : notes,
    };

    try {
      await save.mutateAsync({ id: lease?.id, data });
      onClose();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Не вдалося зберегти");
    }
  }

  return (
    <Modal open={open} title={lease ? "Редагувати договір" : "Новий договір"} onClose={onClose}>
      <form className={formStyles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Select
          label="Об'єкт"
          error={errors.propertyId?.message}
          {...register("propertyId", { onChange: (e) => fillRent(e.target.value) })}
        >
          <option value="">Оберіть об'єкт</option>
          {properties.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </Select>

        <Select label="Орендар" error={errors.tenantId?.message} {...register("tenantId")}>
          <option value="">Оберіть орендаря</option>
          {tenants.data?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.firstName} {t.lastName}
            </option>
          ))}
        </Select>

        <Input label="Початок" type="date" error={errors.startDate?.message} {...register("startDate")} />
        <Input label="Закінчення" type="date" error={errors.endDate?.message} {...register("endDate")} />

        <Input label="Оренда на місяць, грн" type="number" error={errors.rentAmount?.message} {...register("rentAmount")} />
        <Input label="Завдаток, грн" type="number" error={errors.depositAmount?.message} {...register("depositAmount")} />

        <Input
          label="Оплата до числа місяця"
          type="number"
          error={errors.paymentDay?.message}
          {...register("paymentDay")}
        />
        <Input
          label="Пеня за день, %"
          type="number"
          step="0.01"
          error={errors.penaltyRatePerDay?.message}
          {...register("penaltyRatePerDay")}
        />

        <div className={formStyles.full}>
          <Input
            label="Щорічна індексація оренди, %"
            type="number"
            step="0.1"
            error={errors.indexationPercent?.message}
            {...register("indexationPercent")}
          />
        </div>

        <label className={`${styles.checkbox} ${formStyles.full}`}>
          <input type="checkbox" {...register("autoRenew")} />
          Автоматично продовжувати договір
        </label>

        <div className={formStyles.full}>
          <Textarea label="Примітки (наприклад, співмешканці)" error={errors.notes?.message} {...register("notes")} />
        </div>

        {serverError && <div className={`${formStyles.alert} ${formStyles.full}`}>{serverError}</div>}

        <div className={`${formStyles.footer} ${formStyles.full}`}>
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