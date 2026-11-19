import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "../../components/ui/Modal/Modal";
import { Input } from "../../components/ui/Input/Input";
import { Textarea } from "../../components/ui/Textarea/Textarea";
import { Button } from "../../components/ui/Button/Button";
import { useSaveTenant } from "../../hooks/useTenants";
import type { TenantListItem } from "../../api/tenants";
import styles from "../Properties/Properties.module.scss";

const schema = z.object({
  firstName: z.string().min(1, "Вкажіть ім'я"),
  lastName: z.string().min(1, "Вкажіть прізвище"),
  email: z.string().email("Введіть коректний email"),
  phone: z.string(),
  documentNumber: z.string(),
  birthDate: z.string(),
  notes: z.string(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  documentNumber: "",
  birthDate: "",
  notes: "",
};

function toFormValues(t: TenantListItem): FormValues {
  return {
    firstName: t.firstName,
    lastName: t.lastName,
    email: t.email,
    phone: t.phone ?? "",
    documentNumber: t.documentNumber ?? "",
    birthDate: t.birthDate ? t.birthDate.slice(0, 10) : "",
    notes: t.notes ?? "",
  };
}

function textOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

type Props = {
  open: boolean;
  tenant: TenantListItem | null;
  onClose: () => void;
};

export function TenantFormModal({ open, tenant, onClose }: Props) {
  const save = useSaveTenant();
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

  useEffect(() => {
    if (open) {
      reset(tenant ? toFormValues(tenant) : emptyValues);
      setServerError("");
    }
  }, [open, tenant, reset]);

  // email зареєстрованого орендаря змінювати не можна, бо він збігається з email його акаунта
  const emailLocked = tenant?.accountStatus === "REGISTERED";

  async function onSubmit(values: FormValues) {
    setServerError("");

    const data = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: textOrNull(values.phone),
      documentNumber: textOrNull(values.documentNumber),
      birthDate: textOrNull(values.birthDate),
      notes: textOrNull(values.notes),
    };

    try {
      await save.mutateAsync({ id: tenant?.id, data });
      onClose();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Не вдалося зберегти");
    }
  }

  return (
    <Modal open={open} title={tenant ? "Редагувати орендаря" : "Новий орендар"} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Ім'я" error={errors.firstName?.message} {...register("firstName")} />
        <Input label="Прізвище" error={errors.lastName?.message} {...register("lastName")} />

        <Input
          label="Email"
          type="email"
          disabled={emailLocked}
          error={errors.email?.message}
          {...register("email")}
        />
        <Input label="Телефон" placeholder="+380..." error={errors.phone?.message} {...register("phone")} />

        <Input
          label="Номер документа (паспорт / ІПН)"
          error={errors.documentNumber?.message}
          {...register("documentNumber")}
        />
        <Input label="Дата народження" type="date" error={errors.birthDate?.message} {...register("birthDate")} />

        <div className={styles.full}>
          <Textarea label="Примітки" error={errors.notes?.message} {...register("notes")} />
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