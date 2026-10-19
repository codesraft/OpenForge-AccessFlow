'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { runAuthRequest } from '@/lib/auth-request';

const LOGIN_PATH = '/login';

// The bar shown on every page for logged-in users.
export function AppHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function logOut() {
    await runAuthRequest(() => authClient.signOut());

    // Clear the query cache so that any cached data from the previous session is removed. This ensures that when the user logs out, they won't see any stale data from their previous session when they log back in or when another user logs in.
    queryClient.clear();
    router.replace(LOGIN_PATH);
  }

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
      <nav className="flex gap-4 text-sm font-medium">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/profile">Profile</Link>
      </nav>
      <button type="button" onClick={logOut} className="text-sm font-medium underline">
        Log out
      </button>
    </header>
  );
}