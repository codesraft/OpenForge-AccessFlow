'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { runAuthRequest } from '@/lib/auth-request';
import { LOGIN_PATH } from '@/lib/config';

export function AppHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function logOut() {
    await runAuthRequest(() => authClient.signOut());

    // Everything cached belongs to the person who just left, so none of it may be shown
    // to the next person who logs in on this browser.
    queryClient.clear();
    router.replace(LOGIN_PATH);
  }

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
      <nav className="flex gap-4 text-sm font-medium">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/profile">Profile</Link>
        <Link href="/security">Security</Link>
      </nav>
      <button type="button" onClick={logOut} className="text-sm font-medium underline">
        Log out
      </button>
    </header>
  );
}