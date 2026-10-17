import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service.js';
import { verificationEmail } from '../services/email-templates.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
import { env } from '../utils/env.js';

const sendMail = vi.hoisted(() => vi.fn());

vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn(() => ({ sendMail })) },
}));

vi.mock('../utils/env.js', () => ({
  env: { smtpUrl: 'smtp://user:pass@smtp.example.com:587', emailFrom: 'no-reply@example.com' },
}));

const link = 'http://localhost:5000/api/auth/verify-email?token=abc123';

beforeEach(() => {
  sendMail.mockReset();
  vi.spyOn(logger, 'error').mockImplementation(() => {});
});

describe('sending emails', () => {
  it('sends the verification email from the configured address', async () => {
    sendMail.mockResolvedValue({});

    await sendVerificationEmail({ to: 'user@example.com', name: 'Sam', url: link });

    const message = sendMail.mock.calls[0][0];
    expect(message.from).toBe('no-reply@example.com');
    expect(message.to).toBe('user@example.com');
    expect(message.text).toContain(link);
    expect(message.html).toContain(link);
  });

  it('sends the password reset email', async () => {
    sendMail.mockResolvedValue({});

    await sendPasswordResetEmail({ to: 'user@example.com', url: link });

    expect(sendMail.mock.calls[0][0].subject).toMatch(/reset/i);
  });

  it('hides the provider error from the user but logs it', async () => {
    sendMail.mockRejectedValue(new Error('535 auth failed for user@smtp.example.com'));

    const attempt = sendVerificationEmail({ to: 'user@example.com', url: link });

    await expect(attempt).rejects.toBeInstanceOf(AppError);
    await expect(attempt).rejects.toThrow('We could not send the email. Please try again.');
    expect(logger.error).toHaveBeenCalled();
  });

  it('fails safely when email is not configured', async () => {
    const originalUrl = env.smtpUrl;
    env.smtpUrl = undefined;

    await expect(sendVerificationEmail({ to: 'user@example.com', url: link })).rejects.toThrow(
      'We could not send the email',
    );
    expect(sendMail).not.toHaveBeenCalled();

    env.smtpUrl = originalUrl;
  });
});

describe('email templates', () => {
  it('escapes characters that could break out of the HTML', () => {
    const { html } = verificationEmail({ name: '<script>', url: 'http://x.test/?a=1&b="2"' });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&amp;b=&quot;2&quot;');
  });
});