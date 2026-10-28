import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDeps } from '@/app/di/useDeps';
import { userKeys } from '@/features/user/presentation/userKeys';
import type { Registration } from '../domain/Credentials';

export function useRegister() {
  const { register } = useDeps();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registration: Registration) => register.execute(registration),
    onSuccess: (session) => queryClient.setQueryData(userKeys.me(), session.user),
  });
}
