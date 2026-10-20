import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ChangePasswordForm } from '@/components/security/change-password-form';
import { apiFetch, ApiError } from '@/lib/api-client';
import { createQueryClient } from '@/lib/query-client';
import { fillIn, clickButton } from './helpers/form-test-utils';

vi.mock('@/lib/api-client', async (importOriginal) => ({
  ...(await importOriginal()),
  apiFetch: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

function renderForm() {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <ChangePasswordForm />
    </QueryClientProvider>,
  );
}

function fillValidForm() {
  fillIn('Current password', 'the-old-password-1');
  fillIn('New password', 'a-brand-new-password-2');
  fillIn('Confirm new password', 'a-brand-new-password-2');
}

describe('ChangePasswordForm', () => {
  it('checks the fields before calling the server', async () => {
    renderForm();

    fillIn('New password', 'short');
    fillIn('Confirm new password', 'different');
    clickButton('Change password');

    expect(await screen.findByText('Enter your current password.')).toBeDefined();
    expect(screen.getByText('Password must be at least 8 characters.')).toBeDefined();
    expect(screen.getByText('Passwords do not match.')).toBeDefined();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('sends the passwords and logs out other devices by default', async () => {
    apiFetch.mockResolvedValue({ user: {} });
    renderForm();
    fillValidForm();

    clickButton('Change password');

    expect(await screen.findByText('Your password has been changed.')).toBeDefined();
    const [path, options] = apiFetch.mock.calls[0];
    expect(path).toBe('/api/auth/change-password');
    expect(JSON.parse(options.body)).toEqual({
      currentPassword: 'the-old-password-1',
      newPassword: 'a-brand-new-password-2',
      revokeOtherSessions: true,
    });
  });

  it('clears the fields after a successful change', async () => {
    apiFetch.mockResolvedValue({ user: {} });
    renderForm();
    fillValidForm();

    clickButton('Change password');
    await screen.findByText('Your password has been changed.');

    expect(screen.getByLabelText('Current password').value).toBe('');
    expect(screen.getByLabelText('New password').value).toBe('');
  });

  it('shows the server error when the current password is wrong', async () => {
    apiFetch.mockRejectedValue(new ApiError(400, 'INVALID_PASSWORD', 'Invalid password'));
    renderForm();
    fillValidForm();

    clickButton('Change password');

    expect(await screen.findByText('Invalid password')).toBeDefined();
  });
});
