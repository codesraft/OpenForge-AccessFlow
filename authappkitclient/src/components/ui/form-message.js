const STYLES = {
  error:
    'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  success:
    'border-green-300 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200',
};

// A banner for the result of a whole form. Errors are announced to screen readers right away.
export function FormMessage({ type = 'error', children }) {
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`rounded-md border px-3 py-2 text-sm ${STYLES[type]}`}
    >
      {children}
    </div>
  );
}