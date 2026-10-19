'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authClient } from '@/lib/auth-client';
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

    const { error } = await authClient.requestPasswordReset({ email });

    if (error) {
      setServerError(getErrorMessage(error));
      return;
    }
    setIsSent(true);
  }

  // If the reset link was sent successfully, we show a success message. If there was an error, we show the error message. Otherwise, we show the form with an email input and a submit button. The form uses react-hook-form for validation and submission handling.
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