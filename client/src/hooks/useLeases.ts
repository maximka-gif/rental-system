import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activateLease,
  createLease,
  deleteLease,
  fetchLeases,
  renewLease,
  terminateLease,
  updateLease,
} from "../api/leases";
import type { LeaseFilters, LeaseInput } from "../api/leases";

export function useLeases(filters: LeaseFilters) {
  return useQuery({
    queryKey: ["leases", filters],
    queryFn: () => fetchLeases(filters),
    placeholderData: keepPreviousData,
  });
}

// зміна договору може змінити статус об'єкта й картку орендаря, тож оновлюємо все пов'язане
function useRefreshAll() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["leases"] }),
      queryClient.invalidateQueries({ queryKey: ["properties"] }),
      queryClient.invalidateQueries({ queryKey: ["property"] }),
      queryClient.invalidateQueries({ queryKey: ["tenants"] }),
    ]);
}

export function useSaveLease() {
  const refresh = useRefreshAll();

  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: LeaseInput }) => {
      if (id) {
        return updateLease(id, data);
      }
      return createLease(data);
    },
    onSuccess: refresh,
  });
}

export function useDeleteLease() {
  const refresh = useRefreshAll();

  return useMutation({
    mutationFn: (id: string) => deleteLease(id),
    onSuccess: refresh,
  });
}

export function useActivateLease() {
  const refresh = useRefreshAll();

  return useMutation({
    mutationFn: (id: string) => activateLease(id),
    onSuccess: refresh,
  });
}

export function useTerminateLease() {
  const refresh = useRefreshAll();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => terminateLease(id, reason),
    onSuccess: refresh,
  });
}

export function useRenewLease() {
  const refresh = useRefreshAll();

  return useMutation({
    mutationFn: ({ id, months }: { id: string; months: number }) => renewLease(id, months),
    onSuccess: refresh,
  });
}