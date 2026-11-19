import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2 } from "lucide-react";
import { acceptInvite, fetchInvite } from "../../api/invites";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import styles from "../LoginPage/LoginPage.module.scss";

const schema = z
  .object({
    password: z.string().min(8, "Пароль мінімум 8 символів"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Паролі не збігаються",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

export function InvitePage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [serverError, setServerError] = useState("");

  const invite = useQuery({
    queryKey: ["invite", token],
    queryFn: () => fetchInvite(token),
    retry: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError("");
    try {
      const data = await acceptInvite(token, values.password);
      setSession(data);
      navigate("/my", { replace: true });
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Не вдалося створити акаунт");
    }
  }

  return (
    <div className={styles.formSide} style={{ minHeight: "100%" }}>
      <div className={styles.form}>
        <div className={styles.brand} style={{ color: "var(--color-text)" }}>
          <span className={styles.logo} style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}>
            <Building2 size={22} />
          </span>
          <span>Оренда</span>
        </div>

        {invite.isLoading && <p>Завантаження...</p>}

        {invite.isError && (
          <>
            <h2>Запрошення недійсне</h2>
            <div className={styles.alert}>
              {invite.error instanceof Error ? invite.error.message : "Не вдалося відкрити запрошення"}
            </div>
          </>
        )}

        {invite.data && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <h2>Вітаємо, {invite.data.firstName}!</h2>
              <p className={styles.muted}>
                {invite.data.ownerName} запрошує вас до системи. Створіть пароль, щоб побачити свій
                договір, платежі й заявки.
              </p>
            </div>

            <Input label="Email" value={invite.data.email} disabled readOnly />
            <Input
              label="Пароль"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <Input
              label="Повторіть пароль"
              type="password"
              autoComplete="new-password"
              error={errors.confirm?.message}
              {...register("confirm")}
            />

            {serverError && <div className={styles.alert}>{serverError}</div>}

            <Button type="submit" fullWidth loading={isSubmitting}>
              Створити акаунт
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}