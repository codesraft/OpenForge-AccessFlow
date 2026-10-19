import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiFetch, ApiError } from '@/lib/api-client';

function stubFetch({ ok = true, status = 200, body = null, json } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: json ?? (async () => body),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('apiFetch', () => {
  it('always sends the session cookie', async () => {
    const fetchMock = stubFetch({ body: { status: 'ok' } });

    const result = await apiFetch('/api/health');

    expect(result).toEqual({ status: 'ok' });
    expect(fetchMock.mock.calls[0][1].credentials).toBe('include');
  });

  it('sends a JSON content type only when there is a body', async () => {
    const fetchMock = stubFetch();

    await apiFetch('/api/profile');
    await apiFetch('/api/profile', { method: 'PATCH', body: '{}' });

    expect(fetchMock.mock.calls[0][1].headers).toBeUndefined();
    expect(fetchMock.mock.calls[1][1].headers['Content-Type']).toBe('application/json');
  });

  it('turns our error format into an ApiError', async () => {
    stubFetch({
      ok: false,
      status: 403,
      body: { error: { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email.' } },
    });

    const attempt = apiFetch('/api/profile');

    await expect(attempt).rejects.toBeInstanceOf(ApiError);
    await expect(attempt).rejects.toMatchObject({ status: 403, code: 'EMAIL_NOT_VERIFIED' });
  });

  it("also understands Better Auth's own error format", async () => {
    stubFetch({
      ok: false,
      status: 403,
      body: { code: 'SESSION_NOT_OWNED', message: 'Not yours.' },
    });

    await expect(apiFetch('/api/auth/revoke-session')).rejects.toMatchObject({
      code: 'SESSION_NOT_OWNED',
      message: 'Not yours.',
    });
  });

  it('falls back to a friendly message when the reply is not JSON', async () => {
    stubFetch({ ok: false, status: 502, json: async () => Promise.reject(new Error('not json')) });

    await expect(apiFetch('/api/profile')).rejects.toMatchObject({
      status: 502,
      code: 'UNKNOWN_ERROR',
      message: 'Something went wrong. Please try again.',
    });
  });
});