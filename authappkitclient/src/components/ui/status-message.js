// A centred message for pages that cannot show their content. It can carry a button or extra content.
export function StatusMessage({ title, message, actionLabel, onAction, children }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">{message}</p>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {actionLabel}
        </button>
      )}
      {children}
    </main>
  );
}