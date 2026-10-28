import { errorMessage } from '@/core/http/HttpError';
import { useLogout } from '@/features/auth/presentation/useLogout';
import { Button } from '@/shared/ui/Button';
import { useCurrentUser } from './useCurrentUser';

export function ProfilePage() {
  const { data: user, isPending, error, refetch } = useCurrentUser();
  const logout = useLogout();

  if (isPending) return <p className="muted">Đang tải…</p>;
  if (error) {
    return (
      <div className="card">
        <p className="error">{errorMessage(error)}</p>
        <Button onClick={() => refetch()}>Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="card">
      {user.avatar && <img className="avatar" src={user.avatar} alt="" />}
      <h2>{user.name || 'Người dùng'}</h2>
      {user.email && <p className="muted">{user.email}</p>}
      <p className="muted">Tham gia: {user.createdAt.toLocaleDateString('vi-VN')}</p>
      <Button variant="secondary" onClick={logout}>
        Đăng xuất
      </Button>
    </div>
  );
}
