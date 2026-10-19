import { describe, it, expect } from 'vitest';
import { runAuthRequest } from '@/lib/auth-request';

describe('runAuthRequest', () => {
  it('passes the answer through when the request works', async () => {
    const answer = { data: { ok: true }, error: null };

    expect(await runAuthRequest(async () => answer)).toBe(answer);
  });

  it('turns a failed network request into an error instead of throwing', async () => {
    const result = await runAuthRequest(async () => {
      throw new TypeError('Failed to fetch');
    });

    expect(result.data).toBeNull();
    expect(result.error.code).toBe('NETWORK_ERROR');
    expect(result.error.message).toMatch(/could not reach the server/i);
  });
});