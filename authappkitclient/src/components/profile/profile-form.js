'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateProfile } from '@/hooks/use-profile';
import { profileSchema } from '@/lib/validation/profile-schemas';
import { FormField } from '@/components/ui/form-field';
import { FormMessage } from '@/components/ui/form-message';
import { SubmitButton } from '@/components/ui/submit-button';

export function ProfileForm({ profile }) {
  const updateProfile = useUpdateProfile();
  const [message, setMessage] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: profile.name, bio: profile.bio },
  });

  async function onSubmit(values) {
    setMessage(null);
    try {
      await updateProfile.mutateAsync(values);
      setMessage({ type: 'success', text: 'Your profile has been saved.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {message && <FormMessage type={message.type}>{message.text}</FormMessage>}
      <FormField
        label="Name"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
      <div className="space-y-1">
        <label htmlFor="profile-bio" className="block text-sm font-medium">
          Bio
        </label>
        <textarea
          id="profile-bio"
          rows={4}
          aria-invalid={Boolean(errors.bio)}
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
          {...register('bio')}
        />
        {errors.bio && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.bio.message}</p>
        )}
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Email: {profile.email}</p>
      <SubmitButton isLoading={updateProfile.isPending} loadingText="Saving...">
        Save changes
      </SubmitButton>
    </form>
  );
}