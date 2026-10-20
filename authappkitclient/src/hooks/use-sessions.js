'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export const SESSIONS_QUERY_KEY = ['sessions'];

export function useSessions() {
  return useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: () => apiFetch('/api/auth/list-sessions'),
  });
}

// The device list is refetched after every change so the screen always matches the server.
function useSessionsMutation(request) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY }),
  });
}

function postJson(path, body) {
  return apiFetch(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
}

export function useRevokeSession() {
  return useSessionsMutation((token) => postJson('/api/auth/revoke-session', { token }));
}

export function useRevokeOtherSessions() {
  return useSessionsMutation(() => postJson('/api/auth/revoke-other-sessions'));
}