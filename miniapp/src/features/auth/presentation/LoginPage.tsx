import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { errorMessage } from '@/core/http/HttpError';
import { Button } from '@/shared/ui/Button';
import { useLogin } from './useLogin';

// Trong Zalo Mini App, access token lấy từ zmp-sdk `getAccessToken()`.
// Khi chạy trên trình duyệt để dev thì dán token thủ công.
export function LoginPage() {
  const [accessToken, setAccessToken] = useState('');
  const login = useLogin();
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate(accessToken, { onSuccess: () => navigate('/', { replace: true }) });
  };

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>Đăng nhập bằng Zalo</h2>
      <label htmlFor="access-token">Access token Zalo</label>
      <input
        id="access-token"
        value={accessToken}
        onChange={(e) => setAccessToken(e.target.value)}
        placeholder="Dán access token…"
        autoComplete="off"
      />
      {login.error && <p className="error">{errorMessage(login.error)}</p>}
      <Button type="submit" disabled={login.isPending}>
        {login.isPending ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </Button>
    </form>
  );
}
