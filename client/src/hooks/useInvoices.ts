import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addInvoiceItem,
  cancelInvoice,
  fetchInvoice,
  fetchInvoices,
  generateInvoices,
  recalculateInvoices,
  recordPayment,
} from "../api/invoices";
import type { InvoiceFilters } from "../api/invoices";

export function useInvoices(filters: InvoiceFilters) {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: () => fetchInvoices(filters),
    placeholderData: keepPreviousData,
  });
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: () => fetchInvoice(id as string),
    enabled: id !== null,
  });
}

// після будь-якої зміни оновлюємо і список, і картку рахунку
function useRefresh() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["invoices"] }),
      queryClient.invalidateQueries({ queryKey: ["invoice"] }),
    ]);
}

export function useGenerateInvoices() {
  const refresh = useRefresh();

  return useMutation({
    mutationFn: (month: string) => generateInvoices(month),
    onSuccess: refresh,
  });
}

export function useRecalculateInvoices() {
  const refresh = useRefresh();

  return useMutation({
    mutationFn: () => recalculateInvoices(),
    onSuccess: refresh,
  });
}

export function useAddInvoiceItem() {
  const refresh = useRefresh();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof addInvoiceItem>[1] }) =>
      addInvoiceItem(id, data),
    onSuccess: refresh,
  });
}

export function useRecordPayment() {
  const refresh = useRefresh();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof recordPayment>[1] }) =>
      recordPayment(id, data),
    onSuccess: refresh,
  });
}

export function useCancelInvoice() {
  const refresh = useRefresh();

  return useMutation({
    mutationFn: (id: string) => cancelInvoice(id),
    onSuccess: refresh,
  });
}