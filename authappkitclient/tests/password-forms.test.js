import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { authClient } from '@/lib/auth-client';
import { fillIn, clickButton } from './helpers/form-test-utils';

vi.mock('@/lib/auth-client', () => ({
  authClient: { requestPasswordReset: vi.fn(), resetPassword: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('ForgotPasswordForm', () => {
  it('rejects an invalid email without calling the server', async () => {
    render(<ForgotPasswordForm />);

    fillIn('Email', 'nope');
    clickButton('Send reset link');

    expect(await screen.findByText('Enter a valid email address.')).toBeDefined();
    expect(authClient.requestPasswordReset).not.toHaveBeenCalled();
  });

  it('shows a neutral message that does not reveal whether the account exists', async () => {
    authClient.requestPasswordReset.mockResolvedValue({ data: {}, error: null });
    render(<ForgotPasswordForm />);

    fillIn('Email', 'sam@example.com');
    clickButton('Send reset link');

    expect(await screen.findByText(/If an account exists for that email/)).toBeDefined();
    expect(authClient.requestPasswordReset).toHaveBeenCalledWith({ email: 'sam@example.com' });
  });

  it('shows an error when the request itself fails', async () => {
    authClient.requestPasswordReset.mockResolvedValue({
      data: null,
      error: {
        status: 429,
        error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' },
      },
    });
    render(<ForgotPasswordForm />);

    fillIn('Email', 'sam@example.com');
    clickButton('Send reset link');

    expect(await screen.findByText('Too many attempts. Please try again later.')).toBeDefined();
  });
});

describe('ResetPasswordForm', () => {
  it('requires the two passwords to match', async () => {
    render(<ResetPasswordForm token="abc" />);

    fillIn('New password', 'a-brand-new-password-2');
    fillIn('Confirm new password', 'different-password-3');
    clickButton('Set new password');

    expect(await screen.findByText('Passwords do not match.')).toBeDefined();
    expect(authClient.resetPassword).not.toHaveBeenCalled();
  });

  it('sends the new password with the token and then links to log in', async () => {
    authClient.resetPassword.mockResolvedValue({ data: {}, error: null });
    render(<ResetPasswordForm token="abc" />);

    fillIn('New password', 'a-brand-new-password-2');
    fillIn('Confirm new password', 'a-brand-new-password-2');
    clickButton('Set new password');

    expect(await screen.findByText('Your password has been updated.')).toBeDefined();
    expect(authClient.resetPassword).toHaveBeenCalledWith({
      newPassword: 'a-brand-new-password-2',
      token: 'abc',
    });
    expect(screen.getByRole('link', { name: 'Log in with your new password' })).toBeDefined();
  });

  it('shows the server error when the link was already used', async () => {
    authClient.resetPassword.mockResolvedValue({
      data: null,
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
    });
    render(<ResetPasswordForm token="abc" />);

    fillIn('New password', 'a-brand-new-password-2');
    fillIn('Confirm new password', 'a-brand-new-password-2');
    clickButton('Set new password');

    expect(await screen.findByText('Invalid token')).toBeDefined();
  });
});