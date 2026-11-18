import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createProperty,
  deletePhoto,
  deleteProperty,
  fetchProperties,
  fetchProperty,
  setCoverPhoto,
  updateProperty,
  uploadPhotos,
} from "../api/properties";
import type {
  PropertyDetails,
  PropertyFilters,
  PropertyInput,
} from "../api/properties";
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["property"] });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["properties"] }),
  });
}

export function usePropertyDetails(id: string) {
  return useQuery({
    queryKey: ["property", id],
    queryFn: () => fetchProperty(id),
  });
}

// спільна логіка для дій із фото: сервер повертає оновлений об'єкт, кладемо його в кеш
function usePhotoMutation<TVars>(id: string, action: (vars: TVars) => Promise<PropertyDetails>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: action,
    onSuccess: (updated) => {
      queryClient.setQueryData(["property", id], updated);
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useUploadPhotos(id: string) {
  return usePhotoMutation(id, (form: FormData) => uploadPhotos(id, form));
}

export function useDeletePhoto(id: string) {
  return usePhotoMutation(id, (photoId: string) => deletePhoto(id, photoId));
}

export function useSetCover(id: string) {
  return usePhotoMutation(id, (photoId: string) => setCoverPhoto(id, photoId));
}