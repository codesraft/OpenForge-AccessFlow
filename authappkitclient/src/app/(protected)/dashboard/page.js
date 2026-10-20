'use client';

import { useSession } from '@/hooks/use-session';

export default function DashboardPage() {
  const { user } = useSession();

  return (
    <main className="mx-auto w-full max-w-2xl space-y-2 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-zinc-600 dark:text-zinc-400">Signed in as {user.email}</p>
    </main>
  );
}
