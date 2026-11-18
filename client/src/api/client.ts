const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const tokens = {
  getAccess() {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// refresh-токен одноразовий, тому паралельні запити чекають на один спільний refresh
let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokens.getRefresh();
  if (!refreshToken) {
    return false;
  }

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    tokens.clear();
    return false;
  }

  const data = await res.json();
  tokens.set(data.accessToken, data.refreshToken);
  return true;
}

type Options = {
  method?: string;
  body?: unknown;
};

export async function api<T>(path: string, options: Options = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const access = tokens.getAccess();
  if (access) {
    headers.Authorization = `Bearer ${access}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  // токен прострочений: пробуємо оновити й повторити запит один раз
  if (res.status === 401 && retry && tokens.getRefresh()) {
    if (!refreshing) {
      refreshing = tryRefresh().finally(() => {
        refreshing = null;
      });
    }
    const refreshed = await refreshing;
    if (refreshed) {
      return api<T>(path, options, false);
    }
  }

  if (!res.ok) {
    let message = "Щось пішло не так";
    try {
      const data = await res.json();
      if (data.message) {
        message = data.message;
      }
    } catch {
      // відповідь без JSON, лишаємо загальне повідомлення
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}