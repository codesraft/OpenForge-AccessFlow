'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { StatusMessage } from '@/components/ui/status-message';

const LOGIN_PATH = '/login';

// A route that only renders its children if the user is logged in and has a verified email. If the user is not logged in, it redirects to the login page. If the user is logged in but has not verified their email, it shows a message telling them to verify their email. If there is an error checking the session, it shows an error message with a retry button.
export function ProtectedRoute({ children }) {
  const router = useRouter();
  const { user, isPending, error, refetch } = useSession();

  // If the session check is still pending, we don't know if the user is logged in or not, so we show a loading skeleton. If there was an error checking the session, we show an error message with a retry button. If the user is logged out, we redirect to the login page. If the user is logged in but has not verified their email, we show a message telling them to verify their email. If the user is logged in and has verified their email, we render the children.
  const isLoggedOut = !isPending && !error && !user;

  useEffect(() => {
    if (isLoggedOut) router.replace(LOGIN_PATH);
  }, [isLoggedOut, router]);

  if (isPending) return <PageSkeleton />;

  // A failed check says nothing about being logged in, so it must not log anyone out.
  if (error) {
    return (
      <StatusMessage
        title="We could not check your session"
        message="Please check your connection and try again."
        actionLabel="Try again"
        onAction={refetch}
      />
    );
  }

  // Keep the skeleton up for the moment it takes to leave for the login page.
  if (!user) return <PageSkeleton />;

  if (!user.emailVerified) {
    return (
      <StatusMessage
        title="Verify your email"
        message="We sent you a link. Open it to confirm your address and unlock your account."
      />
    );
  }

  return children;
}