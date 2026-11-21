import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Building2,
  LayoutDashboard,
  Users,
  FileText,
  Wallet,
  Wrench,
  TrendingUp,
  Settings,
  Menu,
  Bell,
  Sun,
  Moon,
  Home,
  LogOut,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";
import styles from "./AppLayout.module.scss";

const ownerMenu = [
  { to: "/", label: "Дашборд", icon: LayoutDashboard, end: true },
  { to: "/properties", label: "Об'єкти", icon: Building2, end: false },
  { to: "/tenants", label: "Орендарі", icon: Users, end: false },
  { to: "/leases", label: "Договори", icon: FileText, end: false },
  { to: "/payments", label: "Платежі", icon: Wallet, end: false },
  { to: "/requests", label: "Заявки на ремонт", icon: Wrench, end: false },
  { to: "/finance", label: "Фінанси", icon: TrendingUp, end: false },
  { to: "/settings", label: "Налаштування", icon: Settings, end: false },
];

const tenantMenu = [
  { to: "/my", label: "Головна", icon: Home, end: true },
  { to: "/my/lease", label: "Мій договір", icon: FileText, end: false },
  { to: "/my/invoices", label: "Рахунки", icon: Wallet, end: false },
  { to: "/my/requests", label: "Заявки на ремонт", icon: Wrench, end: false },
  { to: "/my/settings", label: "Налаштування", icon: Settings, end: false },
];

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const menu = user?.role === "TENANT" ? tenantMenu : ownerMenu;
  const initials = user ? user.firstName[0] + user.lastName[0] : "";
  const roleLabel = {
    OWNER: "Власник",
    TENANT: "Орендар",
    ADMIN: "Адміністратор",
  };

  return (
    <div className={styles.layout}>
      {menuOpen && (
        <div className={styles.backdrop} onClick={() => setMenuOpen(false)} />
      )}

      <aside className={cn(styles.sidebar, menuOpen && styles.open)}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <Building2 size={20} />
          </span>
          <span>Оренда</span>
        </div>

        <nav className={styles.nav}>
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn(styles.link, isActive && styles.active)
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className={styles.content}>
        <header className={styles.header}>
          <button
            className={styles.iconButton + " " + styles.burger}
            onClick={() => setMenuOpen(true)}
            aria-label="Відкрити меню"
          >
            <Menu size={20} />
          </button>

          <div className={styles.spacer} />

          <button
            className={styles.iconButton}
            onClick={toggle}
            aria-label="Змінити тему"
          >
            {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
          </button>

          <button className={styles.iconButton} aria-label="Сповіщення">
            <Bell size={19} />
            <span className={styles.bellCount}>3</span>
          </button>

          <div className={styles.user}>
            <span className={styles.avatar}>{initials}</span>
            <div className={styles.userText}>
              <span className={styles.userName}>
                {user?.firstName} {user?.lastName}
              </span>
              <span className={styles.userRole}>
                {user ? roleLabel[user.role] : ""}
              </span>
            </div>
          </div>

          <button
            className={styles.iconButton}
            onClick={logout}
            aria-label="Вийти"
          >
            <LogOut size={19} />
          </button>
        </header>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
