'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export const SESSIONS_QUERY_KEY = ['sessions'];

function postJson(path, body) {
  return apiFetch(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
}

export function useSessions() {
  return useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: () => apiFetch('/api/auth/list-sessions'),
  });
}

// This function is a custom hook that wraps the useMutation hook from React Query. It takes a request function as an argument and returns a mutation object. When the mutation is successful, it invalidates the sessions query, causing it to refetch and update the session data in the UI.
function useSessionsMutation(request) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY }),
  });
}

export function useRevokeSession() {
  return useSessionsMutation((token) => postJson('/api/auth/revoke-session', { token }));
}

export function useRevokeOtherSessions() {
  return useSessionsMutation(() => postJson('/api/auth/revoke-other-sessions'));
}

export function useChangePassword() {
  return useSessionsMutation((values) => postJson('/api/auth/change-password', values));
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () =>
      apiFetch('/api/account', {
        method: 'DELETE',
        body: JSON.stringify({ confirmation: 'DELETE' }),
      }),
  });
}