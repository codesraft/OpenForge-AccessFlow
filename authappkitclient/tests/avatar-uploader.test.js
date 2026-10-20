import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AvatarUploader } from '@/components/profile/avatar-uploader';
import { apiFetch, ApiError } from '@/lib/api-client';
import { createQueryClient } from '@/lib/query-client';
import { resizeImage } from '@/utils/resize-image';

vi.mock('@/lib/api-client', async (importOriginal) => ({
  ...(await importOriginal()),
  apiFetch: vi.fn(),
}));
vi.mock('@/utils/resize-image', () => ({ resizeImage: vi.fn() }));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

function renderUploader(props = { name: 'Sam Rahman', avatarUrl: null }) {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <AvatarUploader {...props} />
    </QueryClientProvider>,
  );
}

function choose(file) {
  fireEvent.change(screen.getByLabelText('Choose a photo'), { target: { files: [file] } });
}

const photo = new File(['photo'], 'me.png', { type: 'image/png' });

describe('AvatarUploader', () => {
  it('shows the initials when there is no avatar yet', () => {
    renderUploader();

    expect(screen.getByLabelText('No avatar yet').textContent).toBe('SR');
  });

  it('shows the current avatar', () => {
    renderUploader({ name: 'Sam Rahman', avatarUrl: 'https://i.ibb.co/a.png' });

    expect(screen.getByAltText('Your avatar').getAttribute('src')).toBe('https://i.ibb.co/a.png');
  });

  it('shrinks the photo and uploads it in the "avatar" field', async () => {
    const resized = new Blob(['small'], { type: 'image/jpeg' });
    resizeImage.mockResolvedValue(resized);
    apiFetch.mockResolvedValue({ avatarUrl: 'https://i.ibb.co/new.jpg' });
    renderUploader();

    choose(photo);

    expect(await screen.findByText('Your photo has been updated.')).toBeDefined();
    const [path, options] = apiFetch.mock.calls[0];
    expect(path).toBe('/api/profile/avatar');
    expect(options.method).toBe('POST');
    expect(options.body.get('avatar')).toBeInstanceOf(Blob);
  });

  it('rejects a file that is not an image without uploading', async () => {
    renderUploader();

    choose(new File(['text'], 'notes.txt', { type: 'text/plain' }));

    expect(await screen.findByText('Choose an image file.')).toBeDefined();
    expect(resizeImage).not.toHaveBeenCalled();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("shows the server's message when the upload is refused", async () => {
    resizeImage.mockResolvedValue(new Blob(['small']));
    apiFetch.mockRejectedValue(
      new ApiError(400, 'FILE_TOO_LARGE', 'The image must be 2 MB or smaller.'),
    );
    renderUploader();

    choose(photo);

    expect(await screen.findByText('The image must be 2 MB or smaller.')).toBeDefined();
  });

  it('shows a message when the photo cannot be processed', async () => {
    resizeImage.mockRejectedValue(new Error('The image could not be processed.'));
    renderUploader();

    choose(photo);

    await waitFor(() =>
      expect(screen.getByText('The image could not be processed.')).toBeDefined(),
    );
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
