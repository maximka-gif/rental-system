import { useState } from "react";
import { Button } from "./components/ui/Button/Button";
import { Input } from "./components/ui/Input/Input";
import { Card } from "./components/ui/Card/Card";
import { Badge } from "./components/ui/Badge/Badge";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <div style={{ padding: 32, display: "flex", justifyContent: "center" }}>
      <Card style={{ maxWidth: 420, width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
        <h2>Тест компонентів</h2>

        <Input label="Email" placeholder="owner@test.com" />
        <Input label="Пароль" type="password" error="Невірний пароль" />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge tone="success">Сплачено</Badge>
          <Badge tone="warning">Очікує</Badge>
          <Badge tone="danger">Прострочено</Badge>
          <Badge tone="info">Здано</Badge>
          <Badge>Вільно</Badge>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button>Основна</Button>
          <Button variant="secondary">Вторинна</Button>
          <Button variant="danger">Видалити</Button>
          <Button variant="ghost">Ghost</Button>
        </div>

        <Button fullWidth onClick={toggleTheme}>
          Тема: {theme === "light" ? "світла" : "темна"}
        </Button>
      </Card>
    </div>
  );
}

export default App;