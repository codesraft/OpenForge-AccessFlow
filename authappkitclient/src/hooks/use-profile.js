'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { SESSION_QUERY_KEY } from './use-session';

export const PROFILE_QUERY_KEY = ['profile'];

export function useProfile() {
  return useQuery({ queryKey: PROFILE_QUERY_KEY, queryFn: () => apiFetch('/api/profile') });
}

// The name comes from the session too, so the session is refetched after any profile change.
function useProfileMutation(request) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: request,
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });
}

export function useUpdateProfile() {
  return useProfileMutation((changes) =>
    apiFetch('/api/profile', { method: 'PATCH', body: JSON.stringify(changes) }),
  );
}

export function useUploadAvatar() {
  return useProfileMutation((image) => {
    const form = new FormData();
    form.append('avatar', image, 'avatar.jpg');

    return apiFetch('/api/profile/avatar', { method: 'POST', body: form });
  });
}
