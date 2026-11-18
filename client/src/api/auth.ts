import { api } from "./client";

export type Role = "OWNER" | "TENANT" | "ADMIN";

export type User = {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone: string | null;
};

type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export function loginRequest(email: string, password: string) {
  return api<AuthResponse>("/auth/login", { method: "POST", body: { email, password } });
}

export function meRequest() {
  return api<User & { tenantId: string | null }>("/auth/me");
}

export function logoutRequest(refreshToken: string) {
  return api<void>("/auth/logout", { method: "POST", body: { refreshToken } });
}