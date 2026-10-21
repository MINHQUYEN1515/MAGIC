import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDeps } from '@/app/di/useDeps';
import { userKeys } from '@/features/user/presentation/userKeys';

export function useLogin() {
  const { loginWithZalo } = useDeps();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accessToken: string) => loginWithZalo.execute(accessToken),
    // Đã có user trong response → ghi thẳng vào cache, khỏi gọi lại /me.
    onSuccess: (session) => queryClient.setQueryData(userKeys.me(), session.user),
  });
}
