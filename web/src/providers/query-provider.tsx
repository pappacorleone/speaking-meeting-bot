"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * React Query Provider with optimized defaults for performance
 *
 * Configuration optimizations:
 * - gcTime: 10 minutes (garbage collect unused queries)
 * - staleTime: 1 minute (reduce unnecessary refetches)
 * - retry: 2 attempts with exponential backoff
 * - refetchOnWindowFocus: false (prevent unexpected refetches)
 * - refetchOnReconnect: true (refresh after network reconnection)
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache garbage collection time (10 minutes)
            gcTime: 10 * 60 * 1000,

            // Data considered fresh for 1 minute
            staleTime: 60 * 1000,

            // Retry failed requests with exponential backoff
            retry: 2,
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),

            // Don't refetch on window focus (prevents unexpected data changes)
            refetchOnWindowFocus: false,

            // Refetch when network reconnects
            refetchOnReconnect: true,

            // Don't refetch on mount if data is fresh
            refetchOnMount: false,

            // Use structural sharing for better performance
            structuralSharing: true,
          },
          mutations: {
            // Retry mutations once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
