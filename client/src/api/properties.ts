import { api } from "./client";

export type PropertyStatus = "VACANT" | "RENTED" | "MAINTENANCE";
export type PropertyType = "APARTMENT" | "HOUSE" | "ROOM" | "COMMERCIAL";

export type PropertyListItem = {
  id: string;
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  city: string;
  address: string;
  area: number | null;
  rooms: number | null;
  floor: number | null;
  description: string | null;
  baseRent: number;
  purchasePrice: number | null;
  coverUrl: string | null;
  tenant: string | null;
  rent: number | null;
};

export type PropertyInput = {
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  city: string;
  address: string;
  area: number | null;
  rooms: number | null;
  floor: number | null;
  description: string | null;
  baseRent: number;
  purchasePrice: number | null;
};

export type PropertyFilters = {
  status: PropertyStatus | "";
  search: string;
};

export function fetchProperties(filters: PropertyFilters) {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.search) {
    params.set("search", filters.search);
  }
  const query = params.toString();
  return api<PropertyListItem[]>(`/properties${query ? `?${query}` : ""}`);
}

export function createProperty(data: PropertyInput) {
  return api<unknown>("/properties", { method: "POST", body: data });
}

export function updateProperty(id: string, data: PropertyInput) {
  return api<unknown>(`/properties/${id}`, { method: "PATCH", body: data });
}

export function deleteProperty(id: string) {
  return api<void>(`/properties/${id}`, { method: "DELETE" });
}

export type PropertyPhoto = { id: string; url: string; isCover: boolean };

export type PropertyLease = {
  id: string;
  number: string;
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED";
  startDate: string;
  endDate: string;
  rentAmount: number;
  tenant: string;
};

export type PropertyDetails = Omit<PropertyListItem, "coverUrl" | "tenant" | "rent"> & {
  photos: PropertyPhoto[];
  leases: PropertyLease[];
};

export function fetchProperty(id: string) {
  return api<PropertyDetails>(`/properties/${id}`);
}

export function uploadPhotos(id: string, form: FormData) {
  return api<PropertyDetails>(`/properties/${id}/photos`, { method: "POST", body: form });
}

export function deletePhoto(id: string, photoId: string) {
  return api<PropertyDetails>(`/properties/${id}/photos/${photoId}`, { method: "DELETE" });
}

export function setCoverPhoto(id: string, photoId: string) {
  return api<PropertyDetails>(`/properties/${id}/photos/${photoId}/cover`, { method: "PATCH" });
}