'use client';

import { useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useSessions, useRevokeSession, useRevokeOtherSessions } from '@/hooks/use-sessions';
import { describeDevice } from '@/utils/describe-device';
import { FormMessage } from '@/components/ui/form-message';

// A long list of devices is shown a page at a time, so the security page stays short.
const PAGE_SIZE = 5;

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function SessionsList() {
  const { session: currentSession } = useSession();
  const { data: sessions, isPending, error } = useSessions();
  const revokeSession = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const [message, setMessage] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // The wording of the confirmation depends on what was done, so each action reports for itself.
  async function run(action, argument, successText) {
    setMessage(null);
    try {
      await action.mutateAsync(argument);
      setMessage({ type: 'success', text: successText });
    } catch (failure) {
      setMessage({ type: 'error', text: failure.message });
    }
  }

  if (isPending) return <p>Loading your devices...</p>;
  if (error) return <FormMessage>{error.message}</FormMessage>;

  const otherSessions = sessions.filter((session) => session.token !== currentSession?.token);
  // This device goes first so it is never hidden behind "Show more".
  const orderedSessions = [
    ...sessions.filter((session) => session.token === currentSession?.token),
    ...otherSessions,
  ];
  const hiddenCount = orderedSessions.length - visibleCount;

  return (
    <div className="space-y-4">
      {message && <FormMessage type={message.type}>{message.text}</FormMessage>}
      <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {orderedSessions.slice(0, visibleCount).map((session) => {
          const isCurrent = session.token === currentSession?.token;

          return (
            <li key={session.id} className="flex items-center justify-between gap-4 p-4">
              <div className="space-y-1 text-sm">
                <p className="font-medium">
                  {describeDevice(session.userAgent)}
                  {isCurrent && (
                    <span className="ml-2 rounded bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-800">
                      This device
                    </span>
                  )}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  IP {session.ipAddress || 'unknown'} · Signed in {formatDate(session.createdAt)}
                </p>
              </div>
              {!isCurrent && (
                <button
                  type="button"
                  disabled={revokeSession.isPending}
                  onClick={() =>
                    run(revokeSession, session.token, 'That device has been logged out.')
                  }
                  className="text-sm font-medium underline disabled:opacity-60"
                >
                  Log out
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          className="text-sm font-medium underline"
        >
          Show more devices ({hiddenCount} hidden)
        </button>
      )}
      <button
        type="button"
        disabled={otherSessions.length === 0 || revokeOthers.isPending}
        onClick={() => run(revokeOthers, undefined, 'All your other devices have been logged out.')}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium disabled:opacity-60 dark:border-zinc-700"
      >
        Log out all other devices
      </button>
    </div>
  );
}