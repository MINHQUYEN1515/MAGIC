import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDeps } from '@/app/di/useDeps';
import { userKeys } from '@/features/user/presentation/userKeys';
import type { Credentials } from '../domain/Credentials';

export function useLogin() {
  const { login } = useDeps();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: Credentials) => login.execute(credentials),
    // Đã có user trong response → ghi thẳng vào cache, khỏi gọi lại /me.
    onSuccess: (session) => queryClient.setQueryData(userKeys.me(), session.user),
  });
}
