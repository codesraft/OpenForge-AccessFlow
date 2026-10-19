import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">AuthAccKit</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        A reusable authentication and account-lifecycle kit.
      </p>
      <div className="flex gap-4 text-sm font-medium">
        <Link href="/login" className="underline">
          Log in
        </Link>
        <Link href="/register" className="underline">
          Create account
        </Link>
      </div>
    </main>
  );
}