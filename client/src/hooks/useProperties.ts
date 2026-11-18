import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProperty,
  deleteProperty,
  fetchProperties,
  updateProperty,
} from "../api/properties";
import type { PropertyFilters, PropertyInput } from "../api/properties";

export function useProperties(filters: PropertyFilters) {
  return useQuery({
    queryKey: ["properties", filters],
    queryFn: () => fetchProperties(filters),
    placeholderData: keepPreviousData,
  });
}

export function useSaveProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: PropertyInput }) => {
      if (id) {
        return updateProperty(id, data);
      }
      return createProperty(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["properties"] }),
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["properties"] }),
  });
}