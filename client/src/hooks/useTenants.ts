import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createInvite, createTenant, deleteTenant, fetchTenants, updateTenant } from "../api/tenants";
import type { TenantInput } from "../api/tenants";

export function useTenants(search: string) {
  return useQuery({
    queryKey: ["tenants", search],
    queryFn: () => fetchTenants(search),
    placeholderData: keepPreviousData,
  });
}

export function useSaveTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: TenantInput }) => {
      if (id) {
        return updateTenant(id, data);
      }
      return createTenant(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenants"] }),
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTenant(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenants"] }),
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => createInvite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenants"] }),
  });
}