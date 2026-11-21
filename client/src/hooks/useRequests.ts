import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addRequestComment,
  changeRequestStatus,
  createRequest,
  fetchRequest,
  fetchRequests,
} from "../api/requests";
import type { RequestFilters } from "../api/requests";

export function useRequests(filters: RequestFilters) {
  return useQuery({
    queryKey: ["requests", filters],
    queryFn: () => fetchRequests(filters),
    placeholderData: keepPreviousData,
  });
}

export function useRequest(id: string | null) {
  return useQuery({
    queryKey: ["request", id],
    queryFn: () => fetchRequest(id as string),
    enabled: id !== null,
  });
}

// після будь-якої зміни оновлюємо і список, і відкриту заявку
function useRefresh() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["requests"] }),
      queryClient.invalidateQueries({ queryKey: ["request"] }),
    ]);
}

export function useCreateRequest() {
  const refresh = useRefresh();

  return useMutation({
    mutationFn: (form: FormData) => createRequest(form),
    onSuccess: refresh,
  });
}

export function useAddComment() {
  const refresh = useRefresh();

  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => addRequestComment(id, text),
    onSuccess: refresh,
  });
}

export function useChangeStatus() {
  const refresh = useRefresh();

  return useMutation({
    mutationFn: ({
      id,
      status,
      cost,
    }: {
      id: string;
      status: "IN_PROGRESS" | "DONE" | "REJECTED";
      cost?: number;
    }) => changeRequestStatus(id, status, cost),
    onSuccess: refresh,
  });
}