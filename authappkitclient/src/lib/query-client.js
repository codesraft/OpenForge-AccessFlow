import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-client';

const MAX_RETRIES = 2;

// A 4xx answer will not change by asking again, but a network problem or a 5xx might.
function shouldRetry(failureCount, error) {
  const isClientError = error instanceof ApiError && error.status >= 400 && error.status < 500;

  return !isClientError && failureCount < MAX_RETRIES;
}

export function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: shouldRetry } } });
}
