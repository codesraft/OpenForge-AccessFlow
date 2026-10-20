'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authClient } from '@/lib/auth-client';
import { runAuthRequest } from '@/lib/auth-request';
import { getErrorMessage } from '@/lib/auth-errors';
import { registerSchema } from '@/lib/validation/auth-schemas';
import { FormField } from '@/components/ui/form-field';
import { FormMessage } from '@/components/ui/form-message';
import { SubmitButton } from '@/components/ui/submit-button';
import { CheckYourEmail } from './check-your-email';

export function RegisterForm() {
  const [serverError, setServerError] = useState(null);
  const [registeredEmail, setRegisteredEmail] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  async function onSubmit({ name, email, password }) {
    setServerError(null);

    const { error } = await runAuthRequest(() =>
      authClient.signUp.email({ name, email, password }),
    );

    if (error) {
      setServerError(getErrorMessage(error));
      return;
    }
    setRegisteredEmail(email);
  }

  if (registeredEmail) return <CheckYourEmail email={registeredEmail} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && <FormMessage>{serverError}</FormMessage>}
      <FormField
        label="Name"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
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
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <FormField
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <SubmitButton isLoading={isSubmitting} loadingText="Creating account...">
        Create account
      </SubmitButton>
      <p className="text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="font-medium underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
