import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../api/auth";

// куди відправляти користувача, якщо він зайшов не на свою сторінку
const homeByRole: Record<Role, string> = {
  OWNER: "/",
  TENANT: "/my",
  ADMIN: "/admin",
};

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 32 }}>Завантаження...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeByRole[user.role]} replace />;
  }

  return <Outlet />;
}