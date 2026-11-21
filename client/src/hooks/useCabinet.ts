import { useQuery } from "@tanstack/react-query";
import { fetchCabinetInvoice, fetchCabinetInvoices, fetchSummary } from "../api/cabinet";

export function useCabinetSummary() {
  return useQuery({ queryKey: ["cabinet", "summary"], queryFn: fetchSummary });
}

export function useCabinetInvoices() {
  return useQuery({ queryKey: ["cabinet", "invoices"], queryFn: fetchCabinetInvoices });
}

export function useCabinetInvoice(id: string | null) {
  return useQuery({
    queryKey: ["cabinet", "invoice", id],
    queryFn: () => fetchCabinetInvoice(id as string),
    enabled: id !== null,
  });
}