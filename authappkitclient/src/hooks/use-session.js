'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export const SESSION_QUERY_KEY = ['session'];

// The server answers null when nobody is logged in, which is a normal result, not an error.
function fetchSession() {
  return apiFetch('/api/auth/get-session');
}

// Read from the server on purpose: the cookie is HttpOnly, so the browser cannot inspect it.
export function useSession() {
  const query = useQuery({ queryKey: SESSION_QUERY_KEY, queryFn: fetchSession });

  return {
    user: query.data?.user ?? null,
    session: query.data?.session ?? null,
    isPending: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}
