import { describe, it, expect } from 'vitest';
import { getErrorCode, getErrorMessage } from '@/lib/auth-errors';

describe('getErrorMessage', () => {
  it('uses a plain-words message for a known code', () => {
    expect(
      getErrorMessage({ code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' }),
    ).toBe('The email or password is not correct.');
    expect(getErrorMessage({ error: { code: 'RATE_LIMITED', message: 'x' } })).toBe(
      'Too many attempts. Please wait a few minutes and try again.',
    );
  });

  it('knows the codes for the services we depend on', () => {
    expect(getErrorMessage({ code: 'EMAIL_SEND_FAILED' })).toMatch(/could not send the email/i);
    expect(getErrorMessage({ code: 'AVATAR_UPLOAD_FAILED' })).toMatch(
      /could not upload your photo/i,
    );
    expect(getErrorMessage({ code: 'FILE_TOO_LARGE' })).toMatch(/2 MB/);
    expect(getErrorMessage({ code: 'NETWORK_ERROR' })).toMatch(/could not reach the server/i);
  });

  it('understands the codes Google sends back, which arrive in lower case', () => {
    expect(getErrorMessage({ code: 'access_denied' })).toBe(
      'You cancelled the sign-in with Google.',
    );
    expect(getErrorMessage({ code: 'account_not_linked' })).toMatch(/already exists/);
  });

  it('falls back to the kind of failure when the code is unknown', () => {
    expect(getErrorMessage({ status: 401 })).toBe('Please log in to continue.');
    expect(getErrorMessage({ status: 403 })).toBe('You do not have permission to do that.');
    expect(getErrorMessage({ status: 429 })).toMatch(/too many attempts/i);
  });

  it('never shows the server text for a server error', () => {
    const message = getErrorMessage({
      status: 500,
      code: 'WHATEVER',
      message: 'connection to db1 lost',
    });

    expect(message).toBe('Something went wrong on our side. Please try again in a moment.');
  });

  it("shows the server's own message for other errors it described", () => {
    expect(
      getErrorMessage({ status: 400, code: 'SOMETHING_NEW', message: 'Name is too long' }),
    ).toBe('Name is too long');
  });

  it('falls back to a general message when there is nothing to go on', () => {
    expect(getErrorMessage({})).toBe('Something went wrong. Please try again.');
    expect(getErrorMessage(null)).toBe('Something went wrong. Please try again.');
  });
});

describe('getErrorCode', () => {
  it('reads the code from either format', () => {
    expect(getErrorCode({ code: 'EMAIL_NOT_VERIFIED' })).toBe('EMAIL_NOT_VERIFIED');
    expect(getErrorCode({ error: { code: 'RATE_LIMITED' } })).toBe('RATE_LIMITED');
    expect(getErrorCode({})).toBeNull();
  });
});
