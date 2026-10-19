import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ProfileForm } from '@/components/profile/profile-form';
import { apiFetch, ApiError } from '@/lib/api-client';
import { createQueryClient } from '@/lib/query-client';
import { fillIn, clickButton } from './helpers/form-test-utils';

vi.mock('@/lib/api-client', async (importOriginal) => ({
  ...(await importOriginal()),
  apiFetch: vi.fn(),
}));

const profile = { name: 'Sam Rahman', email: 'sam@example.com', bio: 'Developer', avatarUrl: null };

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

function renderForm() {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <ProfileForm profile={profile} />
    </QueryClientProvider>,
  );
}

describe('ProfileForm', () => {
  it('starts with the current name and bio', () => {
    renderForm();

    expect(screen.getByLabelText('Name').value).toBe('Sam Rahman');
    expect(screen.getByLabelText('Bio').value).toBe('Developer');
    expect(screen.getByText('Email: sam@example.com')).toBeDefined();
  });

  it('checks the fields before calling the server', async () => {
    renderForm();

    fillIn('Name', '   ');
    fillIn('Bio', 'x'.repeat(301));
    clickButton('Save changes');

    expect(await screen.findByText('Enter your name.')).toBeDefined();
    expect(screen.getByText('Bio must be 300 characters or fewer.')).toBeDefined();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('saves the changes and confirms it', async () => {
    apiFetch.mockResolvedValue({ ...profile, name: 'Sam R.' });
    renderForm();

    fillIn('Name', 'Sam R.');
    clickButton('Save changes');

    expect(await screen.findByText('Your profile has been saved.')).toBeDefined();
    const [path, options] = apiFetch.mock.calls[0];
    expect(path).toBe('/api/profile');
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(options.body)).toEqual({ name: 'Sam R.', bio: 'Developer' });
  });

  it('shows the error from the server', async () => {
    apiFetch.mockRejectedValue(new ApiError(0, 'NETWORK_ERROR', 'We could not reach the server.'));
    renderForm();

    clickButton('Save changes');

    expect(await screen.findByText('We could not reach the server.')).toBeDefined();
  });
});