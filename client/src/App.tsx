import { useState } from "react";
import { Building2, Home, KeyRound, DoorOpen, Wrench, AlertTriangle, Eye, Pencil } from "lucide-react";
import { Button } from "./components/ui/Button/Button";
import { Badge } from "./components/ui/Badge/Badge";
import { Table } from "./components/ui/Table/Table";
import { CellMain, Money, RowActions } from "./components/ui/Table/TableParts";

type Status = "Здано" | "Вільно" | "Ремонт";

type Row = {
  id: string;
  title: string;
  address: string;
  home: boolean;
  rent: number;
  tenant: string;
  status: Status;
};

const rows: Row[] = [
  { id: "1", title: "1-кімн. квартира в центрі", address: "вул. Ольги Кобилянської, 21", home: false, rent: 15000, tenant: "Олена Петренко", status: "Здано" },
  { id: "2", title: "2-кімн. квартира", address: "вул. Сторожинецька, 45", home: false, rent: 22000, tenant: "Андрій Шевченко", status: "Здано" },
  { id: "3", title: "Студія біля університету", address: "вул. Коцюбинського, 6", home: false, rent: 9500, tenant: "Ігор Мельник", status: "Ремонт" },
  { id: "4", title: "Будинок із садом", address: "вул. Головна, 120", home: true, rent: 30000, tenant: "-", status: "Вільно" },
];

const statusView = {
  Здано: { tone: "success", icon: <KeyRound size={13} /> },
  Вільно: { tone: "info", icon: <DoorOpen size={13} /> },
  Ремонт: { tone: "warning", icon: <Wrench size={13} /> },
} as const;

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Об'єкти нерухомості</h1>
        <Button variant="secondary" onClick={toggleTheme}>
          {theme === "light" ? "Темна тема" : "Світла тема"}
        </Button>
      </header>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Badge tone="success" icon={<KeyRound size={13} />}>Здано</Badge>
        <Badge tone="info" icon={<DoorOpen size={13} />}>Вільно</Badge>
        <Badge tone="warning" icon={<Wrench size={13} />}>Ремонт</Badge>
        <Badge tone="danger" icon={<AlertTriangle size={13} />} pulse>Прострочено</Badge>
        <Badge tone="success">Сплачено</Badge>
        <Badge tone="neutral">Чернетка</Badge>
      </div>

      <Table
        rows={rows}
        getRowKey={(r) => r.id}
        getRowTone={(r) => statusView[r.status].tone}
        columns={[
          {
            header: "Об'єкт",
            render: (r) => (
              <CellMain
                icon={r.home ? <Home size={20} /> : <Building2 size={20} />}
                title={r.title}
                subtitle={r.address}
              />
            ),
          },
          { header: "Орендар", render: (r) => r.tenant },
          { header: "Оренда", align: "right", render: (r) => <Money value={r.rent} /> },
          {
            header: "Статус",
            render: (r) => (
              <Badge tone={statusView[r.status].tone} icon={statusView[r.status].icon}>
                {r.status}
              </Badge>
            ),
          },
          {
            header: "",
            align: "right",
            render: () => (
              <RowActions>
                <Button variant="ghost" size="sm" aria-label="Переглянути"><Eye size={16} /></Button>
                <Button variant="ghost" size="sm" aria-label="Редагувати"><Pencil size={16} /></Button>
              </RowActions>
            ),
          },
        ]}
      />
    </div>
  );
}

export default App;