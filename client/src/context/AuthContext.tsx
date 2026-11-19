import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { loginRequest, logoutRequest, meRequest } from "../api/auth";
import type { User } from "../api/auth";
import { tokens } from "../api/client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  }) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // при запуску сторінки перевіряємо, чи є збережений вхід
  useEffect(() => {
    async function restore() {
      if (!tokens.getAccess() && !tokens.getRefresh()) {
        setLoading(false);
        return;
      }

      try {
        const me = await meRequest();
        setUser(me);
      } catch {
        tokens.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restore();
  }, []);

  async function login(email: string, password: string) {
    const data = await loginRequest(email, password);
    tokens.set(data.accessToken, data.refreshToken);
    setUser(data.user);
  }

  async function logout() {
    const refreshToken = tokens.getRefresh();
    if (refreshToken) {
      try {
        await logoutRequest(refreshToken);
      } catch {
        // навіть якщо сервер не відповів, локально все одно виходимо
      }
    }
    tokens.clear();
    setUser(null);
  }

    function setSession(data: { user: User; accessToken: string; refreshToken: string }) {
    tokens.set(data.accessToken, data.refreshToken);
    setUser(data.user);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth потрібно використовувати всередині AuthProvider");
  }
  return ctx;
}
