'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query-client';

export function Providers({ children }) {
  // We create the query client only once, when the component is first rendered. This ensures that the same client instance is used for the entire lifetime of the app, which is important for caching and state management.
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}