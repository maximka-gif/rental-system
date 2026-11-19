import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button/Button";
import { Card } from "../components/ui/Card/Card";

export function AccountHomePage() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 520, margin: "64px auto", padding: 24 }}>
      <Card style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h1>Вітаємо, {user?.firstName}!</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          Ви увійшли як {user?.email}. Кабінет із договором, платежами та заявками на ремонт зʼявиться
          тут пізніше.
        </p>
        <Button variant="secondary" onClick={logout}>
          Вийти
        </Button>
      </Card>
    </div>
  );
}