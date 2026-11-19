import { api } from "./client";

export type LeaseStatus = "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED";

export type Lease = {
  id: string;
  number: string;
  status: LeaseStatus;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  paymentDay: number;
  penaltyRatePerDay: number;
  indexationPercent: number;
  autoRenew: boolean;
  notes: string | null;
  terminatedAt: string | null;
  terminationReason: string | null;
  property: { id: string; title: string; address: string };
  tenant: { id: string; name: string };
  documents: { id: string; name: string; type: string; url: string }[];
};

export type LeaseInput = {
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  paymentDay: number;
  penaltyRatePerDay: number;
  indexationPercent: number;
  autoRenew: boolean;
  notes: string | null;
};

export type LeaseFilters = {
  status: LeaseStatus | "";
  search: string;
};

export type RenewResult = {
  lease: Lease;
  previousRent: number;
  newRent: number;
  indexationPercent: number;
};

export function fetchLeases(filters: LeaseFilters) {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.search) {
    params.set("search", filters.search);
  }
  const query = params.toString();
  return api<Lease[]>(`/leases${query ? `?${query}` : ""}`);
}

export function createLease(data: LeaseInput) {
  return api<Lease>("/leases", { method: "POST", body: data });
}

export function updateLease(id: string, data: LeaseInput) {
  return api<Lease>(`/leases/${id}`, { method: "PATCH", body: data });
}

export function deleteLease(id: string) {
  return api<void>(`/leases/${id}`, { method: "DELETE" });
}

export function activateLease(id: string) {
  return api<Lease>(`/leases/${id}/activate`, { method: "POST" });
}

export function terminateLease(id: string, reason: string) {
  return api<Lease>(`/leases/${id}/terminate`, { method: "POST", body: { reason } });
}

export function renewLease(id: string, months: number) {
  return api<RenewResult>(`/leases/${id}/renew`, { method: "POST", body: { months } });
}