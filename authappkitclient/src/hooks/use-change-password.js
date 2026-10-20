'use client';

import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export function useChangePassword() {
  return useMutation({
    mutationFn: (values) =>
      apiFetch('/api/auth/change-password', { method: 'POST', body: JSON.stringify(values) }),
  });
}
