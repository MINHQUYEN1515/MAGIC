import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { errorMessage } from '@/core/http/HttpError';
import { Button } from '@/shared/ui/Button';
import { useLogin } from './useLogin';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password }, { onSuccess: () => navigate('/profile', { replace: true }) });
  };

  return (
    <form className="card" onSubmit={onSubmit} noValidate>
      <h2>Đăng nhập</h2>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <label htmlFor="password">Mật khẩu</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      {login.error && <p className="error">{errorMessage(login.error)}</p>}
      <Button type="submit" disabled={login.isPending}>
        {login.isPending ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </Button>
      <p className="muted">
        Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
      </p>
    </form>
  );
}
