'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export const SESSION_QUERY_KEY = ['session'];

// The server answers null when nobody is logged in, which is a normal result, not an error.
function fetchSession() {
  return apiFetch('/api/auth/get-session');
}

// This hook returns the current session and user, or null if nobody is logged in. It uses TanStack Query to cache the result and keep it up to date. The session is read from the server, so it is always accurate even if the user logs in or out in another tab.
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