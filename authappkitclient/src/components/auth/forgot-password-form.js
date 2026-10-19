'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authClient } from '@/lib/auth-client';
import { runAuthRequest } from '@/lib/auth-request';
import { getErrorMessage } from '@/lib/auth-errors';
import { forgotPasswordSchema } from '@/lib/validation/auth-schemas';
import { FormField } from '@/components/ui/form-field';
import { FormMessage } from '@/components/ui/form-message';
import { SubmitButton } from '@/components/ui/submit-button';

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState(null);
  const [isSent, setIsSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit({ email }) {
    setServerError(null);

    const { error } = await runAuthRequest(() => authClient.requestPasswordReset({ email }));

    if (error) {
      setServerError(getErrorMessage(error));
      return;
    }
    setIsSent(true);
  }

  // The same message is shown whether or not the email has an account, so this page
  // cannot be used to find out who is registered.
  if (isSent) {
    return (
      <FormMessage type="success">
        If an account exists for that email, we sent a link to reset the password.
      </FormMessage>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && <FormMessage>{serverError}</FormMessage>}
      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <SubmitButton isLoading={isSubmitting} loadingText="Sending...">
        Send reset link
      </SubmitButton>
      <p className="text-center text-sm">
        <Link href="/login" className="underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}