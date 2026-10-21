import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useDeps } from '@/app/di/useDeps';

export function useLogout() {
  const { logout } = useDeps();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return () => {
    logout.execute();
    queryClient.clear();
    navigate('/login', { replace: true });
  };
}
