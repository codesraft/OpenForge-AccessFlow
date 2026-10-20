'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authClient } from '@/lib/auth-client';
import { runAuthRequest } from '@/lib/auth-request';
import { getErrorCode, getErrorMessage } from '@/lib/auth-errors';
import { loginSchema } from '@/lib/validation/auth-schemas';
import { AFTER_LOGIN_PATH } from '@/lib/config';
import { SESSION_QUERY_KEY } from '@/hooks/use-session';
import { FormField } from '@/components/ui/form-field';
import { FormMessage } from '@/components/ui/form-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { ResendVerificationButton } from './resend-verification-button';

export function LoginForm({ initialError = null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState(initialError);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  async function onSubmit({ email, password }) {
    setServerError(null);
    setUnverifiedEmail(null);

    const { error } = await runAuthRequest(() => authClient.signIn.email({ email, password }));

    if (error) {
      if (getErrorCode(error) === 'EMAIL_NOT_VERIFIED') setUnverifiedEmail(email);
      else setServerError(getErrorMessage(error));
      return;
    }

    // The session has changed, so anything cached for the previous one must go.
    queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
    router.replace(AFTER_LOGIN_PATH);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && <FormMessage>{serverError}</FormMessage>}
      {unverifiedEmail && (
        <div className="space-y-2">
          <FormMessage>Please verify your email before logging in.</FormMessage>
          <ResendVerificationButton email={unverifiedEmail} />
        </div>
      )}
      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <FormField
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <SubmitButton isLoading={isSubmitting} loadingText="Logging in...">
        Log in
      </SubmitButton>
      <p className="flex justify-between text-sm">
        <Link href="/forgot-password" className="underline">
          Forgot password?
        </Link>
        <Link href="/register" className="font-medium underline">
          Create account
        </Link>
      </p>
    </form>
  );
}