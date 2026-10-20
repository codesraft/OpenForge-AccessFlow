import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { RegisterForm } from '@/components/auth/register-form';
import { authClient } from '@/lib/auth-client';
import { fillIn, clickButton } from './helpers/form-test-utils';

vi.mock('@/lib/auth-client', () => ({
  authClient: { signUp: { email: vi.fn() }, sendVerificationEmail: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

function fillValidForm() {
  fillIn('Name', 'Sam Rahman');
  fillIn('Email', 'sam@example.com');
  fillIn('Password', 'a-strong-password-1');
  fillIn('Confirm password', 'a-strong-password-1');
}

describe('RegisterForm', () => {
  it('shows a message for each invalid field and does not call the server', async () => {
    render(<RegisterForm />);

    fillIn('Email', 'not-an-email');
    fillIn('Password', 'short');
    clickButton('Create account');

    expect(await screen.findByText('Enter your name.')).toBeDefined();
    expect(screen.getByText('Enter a valid email address.')).toBeDefined();
    expect(screen.getByText('Password must be at least 8 characters.')).toBeDefined();
    expect(authClient.signUp.email).not.toHaveBeenCalled();
  });

  it('requires both passwords to match', async () => {
    render(<RegisterForm />);
    fillValidForm();
    fillIn('Confirm password', 'something-else-1');

    clickButton('Create account');

    expect(await screen.findByText('Passwords do not match.')).toBeDefined();
    expect(authClient.signUp.email).not.toHaveBeenCalled();
  });

  it('sends the details and then asks the user to check their email', async () => {
    authClient.signUp.email.mockResolvedValue({ data: {}, error: null });
    render(<RegisterForm />);
    fillValidForm();

    clickButton('Create account');

    expect(await screen.findByText('sam@example.com')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Resend verification email' })).toBeDefined();
    expect(authClient.signUp.email).toHaveBeenCalledWith({
      name: 'Sam Rahman',
      email: 'sam@example.com',
      password: 'a-strong-password-1',
    });
  });

  it('shows the error from the server and keeps the form', async () => {
    authClient.signUp.email.mockResolvedValue({
      data: null,
      error: { code: 'USER_ALREADY_EXISTS', message: 'User already exists' },
    });
    render(<RegisterForm />);
    fillValidForm();

    clickButton('Create account');

    expect(await screen.findByRole('alert')).toBeDefined();
    expect(
      screen.getByText('An account with this email already exists. Try logging in instead.'),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeDefined();
  });

  it('shows a friendly message when the server cannot be reached', async () => {
    authClient.signUp.email.mockRejectedValue(new TypeError('Failed to fetch'));
    render(<RegisterForm />);
    fillValidForm();

    clickButton('Create account');

    expect(await screen.findByText(/could not reach the server/i)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeDefined();
  });

  it('shows a loading label while the request is running', async () => {
    authClient.signUp.email.mockReturnValue(new Promise(() => {}));
    render(<RegisterForm />);
    fillValidForm();

    clickButton('Create account');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Creating account...' })).toBeDefined(),
    );
  });
});
