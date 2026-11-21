import { api } from "./client";

export type RequestStatus = "NEW" | "IN_PROGRESS" | "DONE" | "REJECTED";
export type RequestPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type MaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  priority: RequestPriority;
  status: RequestStatus;
  cost: number | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  property: { id: string; title: string };
  tenant: { id: string; name: string } | null;
  coverUrl: string | null;
  photosCount: number;
  commentsCount: number;
};

export type RequestComment = {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; name: string; role: "OWNER" | "TENANT" | "ADMIN" };
};

export type RequestDetails = MaintenanceRequest & {
  photos: { id: string; url: string }[];
  comments: RequestComment[];
};

export type RequestFilters = {
  status: RequestStatus | "";
  propertyId: string;
  search: string;
};

export function fetchRequests(filters: RequestFilters) {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.propertyId) {
    params.set("propertyId", filters.propertyId);
  }
  if (filters.search) {
    params.set("search", filters.search);
  }

  const query = params.toString();
  return api<MaintenanceRequest[]>(`/requests${query ? `?${query}` : ""}`);
}

export function fetchRequest(id: string) {
  return api<RequestDetails>(`/requests/${id}`);
}

export function createRequest(form: FormData) {
  return api<RequestDetails>("/requests", { method: "POST", body: form });
}

export function addRequestComment(id: string, text: string) {
  return api<RequestDetails>(`/requests/${id}/comments`, { method: "POST", body: { text } });
}

export function changeRequestStatus(id: string, status: "IN_PROGRESS" | "DONE" | "REJECTED", cost?: number) {
  return api<RequestDetails>(`/requests/${id}/status`, { method: "PATCH", body: { status, cost } });
}