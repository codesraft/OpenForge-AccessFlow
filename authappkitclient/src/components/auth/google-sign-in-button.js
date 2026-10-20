'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { runAuthRequest } from '@/lib/auth-request';
import { getErrorMessage } from '@/lib/auth-errors';
import { AFTER_LOGIN_PATH, LOGIN_PATH } from '@/lib/config';
import { FormMessage } from '@/components/ui/form-message';

// A button that starts the Google sign-in flow. It handles the redirect to Google and any errors that occur during the process. If the sign-in is successful, the user is redirected to the dashboard; if there is an error, it displays an appropriate message.
export function GoogleSignInButton({ label = 'Continue with Google' }) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  async function startGoogleSignIn() {
    setErrorMessage(null);
    setIsRedirecting(true);

    // Both URLs must be absolute and on this site, because the server redirects the browser to them.
    const { origin } = window.location;
    const { error } = await runAuthRequest(() =>
      authClient.signIn.social({
        provider: 'google',
        callbackURL: `${origin}${AFTER_LOGIN_PATH}`,
        errorCallbackURL: `${origin}${LOGIN_PATH}`,
      }),
    );

    // On success the browser is already leaving for Google, so there is nothing more to do.
    if (error) {
      setErrorMessage(getErrorMessage(error));
      setIsRedirecting(false);
    }
  }

  return (
    <div className="space-y-2">
      {errorMessage && <FormMessage>{errorMessage}</FormMessage>}
      <button
        type="button"
        onClick={startGoogleSignIn}
        disabled={isRedirecting}
        className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-60 dark:border-zinc-700"
      >
        {isRedirecting ? 'Redirecting to Google...' : label}
      </button>
    </div>
  );
}
