'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteAccount } from '@/hooks/use-delete-account';
import { DELETE_CONFIRMATION_WORD } from '@/lib/config';
import { FormMessage } from '@/components/ui/form-message';

const AFTER_DELETE_PATH = '/';

export function DeleteAccountSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const deleteAccount = useDeleteAccount();
  const [typedWord, setTypedWord] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  async function onDelete() {
    setErrorMessage(null);
    try {
      await deleteAccount.mutateAsync();
    } catch (error) {
      setErrorMessage(error.message);
      return;
    }

    // The account and every session are gone, so nothing cached may stay behind.
    queryClient.clear();
    router.replace(AFTER_DELETE_PATH);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        This permanently deletes your account, your profile and every device login. It cannot be
        undone.
      </p>
      {errorMessage && <FormMessage>{errorMessage}</FormMessage>}
      <label className="block space-y-1 text-sm font-medium">
        Type {DELETE_CONFIRMATION_WORD} to confirm
        <input
          value={typedWord}
          onChange={(event) => setTypedWord(event.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm font-normal dark:border-zinc-700"
        />
      </label>
      <button
        type="button"
        disabled={typedWord !== DELETE_CONFIRMATION_WORD || deleteAccount.isPending}
        onClick={onDelete}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {deleteAccount.isPending ? 'Deleting...' : 'Delete my account'}
      </button>
    </div>
  );
}
