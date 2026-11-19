import { api } from "./client";

export type AccountStatus = "REGISTERED" | "INVITED" | "NONE";

export type TenantListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  documentNumber: string | null;
  birthDate: string | null;
  notes: string | null;
  reliabilityScore: number;
  accountStatus: AccountStatus;
  property: string | null;
};

export type TenantInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  documentNumber: string | null;
  birthDate: string | null;
  notes: string | null;
};

export type InviteResult = {
  token: string;
  link: string;
  expiresAt: string;
};

export function fetchTenants(search: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return api<TenantListItem[]>(`/tenants${query}`);
}

export function createTenant(data: TenantInput) {
  return api<unknown>("/tenants", { method: "POST", body: data });
}

export function updateTenant(id: string, data: TenantInput) {
  return api<unknown>(`/tenants/${id}`, { method: "PATCH", body: data });
}

export function deleteTenant(id: string) {
  return api<void>(`/tenants/${id}`, { method: "DELETE" });
}

export function createInvite(id: string) {
  return api<InviteResult>(`/tenants/${id}/invite`, { method: "POST" });
}