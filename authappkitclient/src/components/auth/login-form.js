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
import { SESSION_QUERY_KEY } from '@/hooks/use-session';
import { FormField } from '@/components/ui/form-field';
import { FormMessage } from '@/components/ui/form-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { ResendVerificationButton } from './resend-verification-button';

const AFTER_LOGIN_PATH = '/dashboard';

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState(null);
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

    // An earlier "nobody is logged in" answer may still be cached. Removing it makes the
    // next page wait for a fresh answer instead of sending the user straight back here.
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