import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { DeleteAccountSection } from '@/components/security/delete-account-section';
import { apiFetch, ApiError } from '@/lib/api-client';
import { createQueryClient } from '@/lib/query-client';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/lib/api-client', async (importOriginal) => ({
  ...(await importOriginal()),
  apiFetch: vi.fn(),
}));

let queryClient;

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = createQueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <DeleteAccountSection />
    </QueryClientProvider>,
  );
});
afterEach(cleanup);

const deleteButton = () => screen.getByRole('button', { name: 'Delete my account' });
const typeConfirmation = (value) =>
  fireEvent.change(screen.getByLabelText(/Type DELETE to confirm/), { target: { value } });

describe('DeleteAccountSection', () => {
  it('keeps the button disabled until the confirmation word is typed exactly', () => {
    expect(deleteButton().hasAttribute('disabled')).toBe(true);

    typeConfirmation('delete');
    expect(deleteButton().hasAttribute('disabled')).toBe(true);

    typeConfirmation('DELETE');
    expect(deleteButton().hasAttribute('disabled')).toBe(false);
  });

  it('deletes the account, forgets cached data and leaves for the home page', async () => {
    apiFetch.mockResolvedValue(null);
    queryClient.setQueryData(['profile'], { name: 'Sam' });
    typeConfirmation('DELETE');

    fireEvent.click(deleteButton());

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    const [path, options] = apiFetch.mock.calls[0];
    expect(path).toBe('/api/account');
    expect(options.method).toBe('DELETE');
    expect(JSON.parse(options.body)).toEqual({ confirmation: 'DELETE' });
    expect(queryClient.getQueryData(['profile'])).toBeUndefined();
  });

  it('stays on the page and shows the error when deleting fails', async () => {
    apiFetch.mockRejectedValue(
      new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.'),
    );
    typeConfirmation('DELETE');

    fireEvent.click(deleteButton());

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeDefined();
    expect(replace).not.toHaveBeenCalled();
  });
});