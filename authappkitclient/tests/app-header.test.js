import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppHeader } from '@/components/layout/app-header';
import { authClient } from '@/lib/auth-client';
import { createQueryClient } from '@/lib/query-client';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/lib/auth-client', () => ({ authClient: { signOut: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('AppHeader', () => {
  it('links to the main pages', () => {
    render(
      <QueryClientProvider client={createQueryClient()}>
        <AppHeader />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('link', { name: 'Dashboard' }).getAttribute('href')).toBe('/dashboard');
    expect(screen.getByRole('link', { name: 'Profile' }).getAttribute('href')).toBe('/profile');
  });

  it('logs out, forgets cached data and goes to the login page', async () => {
    authClient.signOut.mockResolvedValue({ data: {}, error: null });
    const queryClient = createQueryClient();
    queryClient.setQueryData(['profile'], { name: 'Sam' });
    render(
      <QueryClientProvider client={queryClient}>
        <AppHeader />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(authClient.signOut).toHaveBeenCalled();
    expect(queryClient.getQueryData(['profile'])).toBeUndefined();
  });
});