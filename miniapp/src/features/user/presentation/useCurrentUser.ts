import { useQuery } from '@tanstack/react-query';
import { useDeps } from '@/app/di/useDeps';
import { userKeys } from './userKeys';

export function useCurrentUser() {
  const { getCurrentUser } = useDeps();
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: () => getCurrentUser.execute(),
  });
}
