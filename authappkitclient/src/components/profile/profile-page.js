'use client';

import { useProfile } from '@/hooks/use-profile';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { StatusMessage } from '@/components/ui/status-message';
import { AvatarUploader } from './avatar-uploader';
import { ProfileForm } from './profile-form';

export function ProfilePage() {
  const { data: profile, isPending, error, refetch } = useProfile();

  if (isPending) return <PageSkeleton />;

  if (error) {
    return (
      <StatusMessage
        title="We could not load your profile"
        message={error.message}
        actionLabel="Try again"
        onAction={refetch}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
      <AvatarUploader name={profile.name} avatarUrl={profile.avatarUrl} />
      <ProfileForm profile={profile} />
    </main>
  );
}
