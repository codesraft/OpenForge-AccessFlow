'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authClient } from '@/lib/auth-client';
import { runAuthRequest } from '@/lib/auth-request';
import { getErrorMessage } from '@/lib/auth-errors';
import { resetPasswordSchema } from '@/lib/validation/auth-schemas';
import { FormField } from '@/components/ui/form-field';
import { FormMessage } from '@/components/ui/form-message';
import { SubmitButton } from '@/components/ui/submit-button';

// The token comes from the link in the email. It works once and expires after an hour.
export function ResetPasswordForm({ token }) {
  const [serverError, setServerError] = useState(null);
  const [isDone, setIsDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit({ newPassword }) {
    setServerError(null);

    const { error } = await runAuthRequest(() => authClient.resetPassword({ newPassword, token }));

    if (error) {
      setServerError(getErrorMessage(error));
      return;
    }
    setIsDone(true);
  }

  if (isDone) {
    return (
      <div className="space-y-4">
        <FormMessage type="success">Your password has been updated.</FormMessage>
        <Link href="/login" className="block text-center text-sm font-medium underline">
          Log in with your new password
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && <FormMessage>{serverError}</FormMessage>}
      <FormField
        label="New password"
        type="password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <FormField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <SubmitButton isLoading={isSubmitting} loadingText="Saving...">
        Set new password
      </SubmitButton>
    </form>
  );
}
