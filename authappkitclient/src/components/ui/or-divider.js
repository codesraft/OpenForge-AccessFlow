// Separates the email form from the other ways of signing in.
export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs uppercase text-zinc-500" aria-hidden="true">
      <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      or
      <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
