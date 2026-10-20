import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { authClient } from '@/lib/auth-client';
import { clickButton } from './helpers/form-test-utils';

vi.mock('@/lib/auth-client', () => ({ authClient: { signIn: { social: vi.fn() } } }));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('GoogleSignInButton', () => {
  it('asks the server to start Google sign-in and to come back to this site', async () => {
    authClient.signIn.social.mockResolvedValue({ data: { url: 'https://accounts.google.com' } });
    render(<GoogleSignInButton />);

    clickButton('Continue with Google');

    await waitFor(() =>
      expect(authClient.signIn.social).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: `${window.location.origin}/dashboard`,
        errorCallbackURL: `${window.location.origin}/login`,
      }),
    );
  });

  it('stays disabled while the browser is leaving for Google', async () => {
    authClient.signIn.social.mockResolvedValue({ data: { url: 'https://accounts.google.com' } });
    render(<GoogleSignInButton />);

    clickButton('Continue with Google');

    const button = await screen.findByRole('button', { name: 'Redirecting to Google...' });
    expect(button.disabled).toBe(true);
  });

  it('shows a friendly message and lets the person try again when it fails', async () => {
    authClient.signIn.social.mockResolvedValue({
      data: null,
      error: { status: 404, code: 'PROVIDER_NOT_FOUND', message: 'Provider not found' },
    });
    render(<GoogleSignInButton />);

    clickButton('Continue with Google');

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Sign-in with Google is not available right now.',
    );
    expect(screen.getByRole('button', { name: 'Continue with Google' }).disabled).toBe(false);
  });

  it('shows the network message when the server cannot be reached', async () => {
    authClient.signIn.social.mockRejectedValue(new TypeError('Failed to fetch'));
    render(<GoogleSignInButton />);

    clickButton('Continue with Google');

    expect((await screen.findByRole('alert')).textContent).toMatch(/could not reach the server/i);
  });

  it('can carry a different label', () => {
    render(<GoogleSignInButton label="Sign up with Google" />);

    expect(screen.getByRole('button', { name: 'Sign up with Google' })).toBeDefined();
  });
});
