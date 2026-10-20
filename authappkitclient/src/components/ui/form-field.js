'use client';

import { useId } from 'react';

// A form field with a label, an input, and an optional error message. The label is linked to the input for accessibility, and the error message is only shown if there is an error. The input can be any type of input (text, password, email, etc.) and accepts all standard input props.
export function FormField({ label, error, ...inputProps }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
