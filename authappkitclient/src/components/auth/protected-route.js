'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { StatusMessage } from '@/components/ui/status-message';
import { LOGIN_PATH } from '@/lib/config';
import { ResendVerificationButton } from './resend-verification-button';

// The client-side check only controls what the UI shows; the server checks the session again on
// every API request.
export function ProtectedRoute({ children }) {
  const router = useRouter();
  const { user, isPending, error, refetch } = useSession();

  // "No session yet" is not "not logged in": redirecting before the check finishes is what makes
  // a logged-in user flicker to the login page.
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
      >
        <ResendVerificationButton email={user.email} />
      </StatusMessage>
    );
  }

  return children;
}