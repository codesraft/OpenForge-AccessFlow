import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { createQueryClient } from '@/lib/query-client';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

// Lets a test decide when the server "answers", to check what the page does while waiting.
function stubSessionResponse() {
  let respond;
  const pending = new Promise((resolve) => {
    respond = resolve;
  });
  vi.stubGlobal('fetch', vi.fn().mockReturnValue(pending));

  return (status, body) => respond({ ok: status < 400, status, json: async () => body });
}

function renderProtectedPage() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <ProtectedRoute>
        <p>Secret page</p>
      </ProtectedRoute>
    </QueryClientProvider>,
  );
}

beforeEach(() => replace.mockClear());

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ProtectedRoute', () => {
  it('shows a skeleton and does not redirect while the session is loading', async () => {
    stubSessionResponse();

    renderProtectedPage();

    expect(screen.getByRole('status', { name: 'Loading' })).toBeDefined();
    expect(screen.queryByText('Secret page')).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects to the login page only after the server says nobody is logged in', async () => {
    const respond = stubSessionResponse();
    renderProtectedPage();
    expect(replace).not.toHaveBeenCalled();

    respond(200, null);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(screen.queryByText('Secret page')).toBeNull();
  });

  it('shows the page to a verified user without redirecting', async () => {
    const respond = stubSessionResponse();
    renderProtectedPage();

    respond(200, { user: { email: 'sam@example.com', emailVerified: true }, session: {} });

    expect(await screen.findByText('Secret page')).toBeDefined();
    expect(replace).not.toHaveBeenCalled();
  });

  it('asks an unverified user to verify instead of showing the page', async () => {
    const respond = stubSessionResponse();
    renderProtectedPage();

    respond(200, { user: { email: 'sam@example.com', emailVerified: false }, session: {} });

    expect(await screen.findByText('Verify your email')).toBeDefined();
    expect(screen.queryByText('Secret page')).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it('does not log anyone out when the session check itself fails', async () => {
    const respond = stubSessionResponse();
    renderProtectedPage();

    respond(400, { error: { code: 'BAD_REQUEST', message: 'Nope' } });

    expect(await screen.findByText('We could not check your session')).toBeDefined();
    expect(replace).not.toHaveBeenCalled();
  });
});