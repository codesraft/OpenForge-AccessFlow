'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { runAuthRequest } from '@/lib/auth-request';
import { getErrorMessage } from '@/lib/auth-errors';
import { FormMessage } from '@/components/ui/form-message';

// Lets someone ask for a new verification link, for example when the first one never arrived.
export function ResendVerificationButton({ email }) {
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState(null);

  async function resend() {
    setStatus('sending');
    setErrorMessage(null);

    const { error } = await runAuthRequest(() => authClient.sendVerificationEmail({ email }));

    if (error) {
      setErrorMessage(getErrorMessage(error));
      setStatus('idle');
      return;
    }
    setStatus('sent');
  }

  if (status === 'sent') {
    return <FormMessage type="success">A new link is on its way. Check your inbox.</FormMessage>;
  }

  return (
    <div className="space-y-2">
      {errorMessage && <FormMessage>{errorMessage}</FormMessage>}
      <button
        type="button"
        onClick={resend}
        disabled={status === 'sending'}
        className="text-sm font-medium underline disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending...' : 'Resend verification email'}
      </button>
    </div>
  );
}