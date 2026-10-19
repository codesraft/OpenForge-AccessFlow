import { describe, it, expect } from 'vitest';
import { getErrorCode, getErrorMessage } from '@/lib/auth-errors';

describe('getErrorMessage', () => {
  it("reads Better Auth's error format", () => {
    expect(getErrorMessage({ code: 'X', message: 'Invalid email or password' })).toBe(
      'Invalid email or password',
    );
  });

  it('reads our own error format', () => {
    expect(
      getErrorMessage({ error: { code: 'RATE_LIMITED', message: 'Too many attempts.' } }),
    ).toBe('Too many attempts.');
  });

  it('falls back to a friendly message', () => {
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