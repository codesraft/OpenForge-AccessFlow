'use client';

import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { DELETE_CONFIRMATION_WORD } from '@/lib/config';

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () =>
      apiFetch('/api/account', {
        method: 'DELETE',
        body: JSON.stringify({ confirmation: DELETE_CONFIRMATION_WORD }),
      }),
  });
}
