'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useChangePassword } from '@/hooks/use-change-password';
import { changePasswordSchema } from '@/lib/validation/security-schemas';
import { FormField } from '@/components/ui/form-field';
import { FormMessage } from '@/components/ui/form-message';
import { SubmitButton } from '@/components/ui/submit-button';

// Other devices are logged out by default, because a password change is often a reaction to a worry.
const EMPTY_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  revokeOtherSessions: true,
};

export function ChangePasswordForm() {
  const changePassword = useChangePassword();
  const [message, setMessage] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY_FORM,
  });

  async function onSubmit({ confirmPassword: _confirmPassword, ...values }) {
    setMessage(null);
    try {
      await changePassword.mutateAsync(values);
      setMessage({ type: 'success', text: 'Your password has been changed.' });
      reset();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {message && <FormMessage type={message.type}>{message.text}</FormMessage>}
      <FormField
        label="Current password"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
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
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('revokeOtherSessions')} />
        Log me out of my other devices
      </label>
      <SubmitButton isLoading={changePassword.isPending} loadingText="Changing...">
        Change password
      </SubmitButton>
    </form>
  );
}
