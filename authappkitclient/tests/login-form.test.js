import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from '@/components/auth/login-form';
import { authClient } from '@/lib/auth-client';
import { createQueryClient } from '@/lib/query-client';
import { SESSION_QUERY_KEY } from '@/hooks/use-session';
import { fillIn, clickButton } from './helpers/form-test-utils';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/lib/auth-client', () => ({
  authClient: { signIn: { email: vi.fn() }, sendVerificationEmail: vi.fn() },
}));

let queryClient;

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = createQueryClient();
});
afterEach(cleanup);

function renderForm() {
  render(
    <QueryClientProvider client={queryClient}>
      <LoginForm />
    </QueryClientProvider>,
  );
  fillIn('Email', 'sam@example.com');
  fillIn('Password', 'a-strong-password-1');
}

describe('LoginForm', () => {
  it('asks for both fields before calling the server', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LoginForm />
      </QueryClientProvider>,
    );

    clickButton('Log in');

    expect(await screen.findByText('Enter a valid email address.')).toBeDefined();
    expect(screen.getByText('Enter your password.')).toBeDefined();
    expect(authClient.signIn.email).not.toHaveBeenCalled();
  });

  it('shows a message straight away when a Google sign-in failed', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LoginForm initialError="You cancelled the sign-in with Google." />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('alert').textContent).toBe('You cancelled the sign-in with Google.');
  });

  it('goes to the dashboard after a successful login', async () => {
    authClient.signIn.email.mockResolvedValue({ data: {}, error: null });
    renderForm();

    clickButton('Log in');

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
    expect(authClient.signIn.email).toHaveBeenCalledWith({
      email: 'sam@example.com',
      password: 'a-strong-password-1',
    });
  });

  it('forgets an old "not logged in" answer so the dashboard does not bounce back', async () => {
    queryClient.setQueryData(SESSION_QUERY_KEY, null);
    authClient.signIn.email.mockResolvedValue({ data: {}, error: null });
    renderForm();

    clickButton('Log in');

    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeUndefined();
  });

  it('shows the server error for a wrong password and stays on the page', async () => {
    authClient.signIn.email.mockResolvedValue({
      data: null,
      error: { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' },
    });
    renderForm();

    clickButton('Log in');

    expect(await screen.findByText('The email or password is not correct.')).toBeDefined();
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows a friendly message when the server cannot be reached', async () => {
    authClient.signIn.email.mockRejectedValue(new TypeError('Failed to fetch'));
    renderForm();

    clickButton('Log in');

    expect(await screen.findByText(/could not reach the server/i)).toBeDefined();
    expect(replace).not.toHaveBeenCalled();
  });

  it('offers to resend the link when the email is not verified yet', async () => {
    authClient.signIn.email.mockResolvedValue({
      data: null,
      error: { code: 'EMAIL_NOT_VERIFIED', message: 'Email not verified' },
    });
    authClient.sendVerificationEmail.mockResolvedValue({ data: {}, error: null });
    renderForm();

    clickButton('Log in');
    expect(await screen.findByText('Please verify your email before logging in.')).toBeDefined();
    clickButton('Resend verification email');

    expect(await screen.findByText(/new link is on its way/i)).toBeDefined();
    expect(authClient.sendVerificationEmail).toHaveBeenCalledWith({ email: 'sam@example.com' });
  });

  it('shows the rate limit message from our own error format', async () => {
    authClient.signIn.email.mockResolvedValue({
      data: null,
      error: {
        status: 429,
        error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' },
      },
    });
    renderForm();

    clickButton('Log in');

    expect(
      await screen.findByText('Too many attempts. Please wait a few minutes and try again.'),
    ).toBeDefined();
  });
});
