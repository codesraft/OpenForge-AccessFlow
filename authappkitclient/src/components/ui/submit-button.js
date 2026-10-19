export function SubmitButton({ isLoading, loadingText, children }) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
    >
      {isLoading ? loadingText : children}
    </button>
  );
}