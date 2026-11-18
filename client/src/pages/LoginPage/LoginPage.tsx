import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Wallet, Wrench, TrendingUp } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import styles from "./LoginPage.module.scss";

const schema = z.object({
  email: z.string().email("Введіть коректний email"),
  password: z.string().min(1, "Введіть пароль"),
});

type FormValues = z.infer<typeof schema>;

const features = [
  { icon: Wallet, text: "Автоматичні рахунки й онлайн-оплата" },
  { icon: Wrench, text: "Заявки на ремонт зі статусами" },
  { icon: TrendingUp, text: "Дохід і рентабельність по кожному об'єкту" },
];

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "owner@test.com", password: "password123" },
  });

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(values: FormValues) {
    setServerError("");
    try {
      await login(values.email, values.password);
      navigate("/", { replace: true });
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Не вдалося увійти");
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <Building2 size={22} />
          </span>
          <span>Оренда</span>
        </div>

        <div>
          <h1 className={styles.title}>Уся ваша оренда в одному місці</h1>
          <ul className={styles.features}>
            {features.map((f) => (
              <li key={f.text}>
                <span className={styles.featureIcon}>
                  <f.icon size={18} />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <p className={styles.footnote}>Інформаційна система обліку оренди нерухомості</p>
      </section>

      <section className={styles.formSide}>
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <h2>Вхід</h2>
            <p className={styles.muted}>Увійдіть, щоб керувати об'єктами й платежами</p>
          </div>

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Пароль"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          {serverError && <div className={styles.alert}>{serverError}</div>}

          <Button type="submit" fullWidth loading={isSubmitting}>
            Увійти
          </Button>

          <p className={styles.hint}>Тестовий акаунт: owner@test.com / password123</p>
        </form>
      </section>
    </div>
  );
}