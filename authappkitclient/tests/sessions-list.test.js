import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, within, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionsList } from '@/components/security/sessions-list';
import { apiFetch, ApiError } from '@/lib/api-client';

vi.mock('@/lib/api-client', async (importOriginal) => ({
  ...(await importOriginal()),
  apiFetch: vi.fn(),
}));
vi.mock('@/hooks/use-session', () => ({
  useSession: () => ({ session: { token: 'tok-laptop' } }),
}));

const laptop = {
  id: '1',
  token: 'tok-laptop',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36',
  ipAddress: '1.1.1.1',
  createdAt: '2026-10-19T10:00:00Z',
};
const phone = {
  id: '2',
  token: 'tok-phone',
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17.0 Mobile Safari/604.1',
  ipAddress: '2.2.2.2',
  createdAt: '2026-10-18T09:00:00Z',
};

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

// No retries here, so a failing request shows its error right away instead of after a delay.
function renderList() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <SessionsList />
    </QueryClientProvider>,
  );
}

describe('SessionsList', () => {
  it('shows each device with its IP address and marks the current one', async () => {
    apiFetch.mockResolvedValue([laptop, phone]);
    renderList();

    expect(await screen.findByText('Chrome on Windows')).toBeDefined();
    expect(screen.getByText('Safari on iOS')).toBeDefined();
    expect(screen.getByText(/IP 1\.1\.1\.1/)).toBeDefined();
    expect(screen.getByText('This device')).toBeDefined();
  });

  it('offers to log out only the other devices, not the current one', async () => {
    apiFetch.mockResolvedValue([laptop, phone]);
    renderList();

    await screen.findByText('Chrome on Windows');

    expect(screen.getAllByRole('button', { name: 'Log out' })).toHaveLength(1);
  });

  it('revokes one device and then shows the refreshed list', async () => {
    apiFetch.mockResolvedValueOnce([laptop, phone]);
    apiFetch.mockResolvedValueOnce({ status: true });
    apiFetch.mockResolvedValueOnce([laptop]);
    renderList();
    await screen.findByText('Safari on iOS');

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByText('That device has been logged out.')).toBeDefined();
    const [path, options] = apiFetch.mock.calls[1];
    expect(path).toBe('/api/auth/revoke-session');
    expect(JSON.parse(options.body)).toEqual({ token: 'tok-phone' });
    await waitFor(() => expect(screen.queryByText('Safari on iOS')).toBeNull());
  });

  it('logs out all other devices', async () => {
    apiFetch.mockResolvedValueOnce([laptop, phone]);
    apiFetch.mockResolvedValueOnce({ status: true });
    apiFetch.mockResolvedValueOnce([laptop]);
    renderList();
    await screen.findByText('Safari on iOS');

    fireEvent.click(screen.getByRole('button', { name: 'Log out all other devices' }));

    expect(await screen.findByText('All your other devices have been logged out.')).toBeDefined();
    expect(apiFetch.mock.calls[1][0]).toBe('/api/auth/revoke-other-sessions');
  });

  it('disables "log out all other devices" when there are none', async () => {
    apiFetch.mockResolvedValue([laptop]);
    renderList();
    await screen.findByText('Chrome on Windows');

    expect(
      screen.getByRole('button', { name: 'Log out all other devices' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('shows the error when a device cannot be logged out', async () => {
    apiFetch.mockResolvedValueOnce([laptop, phone]);
    apiFetch.mockRejectedValueOnce(
      new ApiError(403, 'SESSION_NOT_OWNED', 'You can only revoke your own sessions.'),
    );
    renderList();
    await screen.findByText('Safari on iOS');

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByText('You can only revoke your own sessions.')).toBeDefined();
    expect(within(screen.getByRole('list')).getByText('Safari on iOS')).toBeDefined();
  });

  it('shows an error when the list cannot be loaded', async () => {
    apiFetch.mockRejectedValue(new ApiError(0, 'NETWORK_ERROR', 'We could not reach the server.'));
    renderList();

    expect(await screen.findByText('We could not reach the server.')).toBeDefined();
  });
});