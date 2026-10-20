// Shown while we do not yet know whether the visitor is logged in.
export function PageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="mx-auto w-full max-w-2xl animate-pulse space-y-4 p-8"
    >
      <div className="h-8 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
