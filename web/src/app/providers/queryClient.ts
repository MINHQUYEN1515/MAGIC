import { QueryClient } from '@tanstack/react-query';
import { HttpError } from '@/core/http/HttpError';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Lỗi 4xx (sai token, không tìm thấy…) thử lại cũng vô ích.
        retry: (failureCount, error) =>
          !(error instanceof HttpError && error.isClientError) && failureCount < 2,
      },
      mutations: { retry: false },
    },
  });
}
