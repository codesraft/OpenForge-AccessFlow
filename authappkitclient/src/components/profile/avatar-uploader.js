'use client';

import { useState } from 'react';
import { useUploadAvatar } from '@/hooks/use-profile';
import { resizeImage } from '@/utils/resize-image';
import { FormMessage } from '@/components/ui/form-message';

function initialsOf(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

export function AvatarUploader({ name, avatarUrl }) {
  const upload = useUploadAvatar();
  const [message, setMessage] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const isBusy = isResizing || upload.isPending;

  async function onFileChosen(event) {
    const file = event.target.files[0];
    // Clearing the input lets the same file be chosen again after an error.
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Choose an image file.' });
      return;
    }

    setMessage(null);
    try {
      setIsResizing(true);
      const image = await resizeImage(file);
      setIsResizing(false);

      await upload.mutateAsync(image);
      setMessage({ type: 'success', text: 'Your photo has been updated.' });
    } catch (error) {
      setIsResizing(false);
      setMessage({ type: 'error', text: error.message });
    }
  }

  return (
    <div className="flex items-center gap-4">
      {avatarUrl ? (
        // A plain <img>: avatars are small and come from imgBB, which next/image would need configuring for.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="Your avatar" className="h-20 w-20 rounded-full object-cover" />
      ) : (
        <div
          aria-label="No avatar yet"
          className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-200 text-xl font-semibold dark:bg-zinc-800"
        >
          {initialsOf(name)}
        </div>
      )}
      <div className="space-y-2">
        <label className="inline-block cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700">
          {isBusy ? 'Uploading...' : 'Change photo'}
          <input
            type="file"
            accept="image/*"
            aria-label="Choose a photo"
            disabled={isBusy}
            onChange={onFileChosen}
            className="sr-only"
          />
        </label>
        {message && <FormMessage type={message.type}>{message.text}</FormMessage>}
      </div>
    </div>
  );
}
