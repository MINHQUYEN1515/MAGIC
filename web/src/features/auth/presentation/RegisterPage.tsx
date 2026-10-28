import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { errorMessage } from '@/core/http/HttpError';
import { Button } from '@/shared/ui/Button';
import { PASSWORD_MIN } from '../domain/Credentials';
import { useRegister } from './useRegister';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const register = useRegister();
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Nhập lại mật khẩu chỉ là việc của form, không gửi lên backend.
    if (password !== confirm) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    register.mutate({ name, email, password }, { onSuccess: () => navigate('/', { replace: true }) });
  };

  const error = mismatch ? 'Mật khẩu nhập lại không khớp' : register.error && errorMessage(register.error);

  return (
    <form className="card" onSubmit={onSubmit} noValidate>
      <h2>Đăng ký</h2>
      <label htmlFor="name">Tên</label>
      <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
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
        autoComplete="new-password"
        placeholder={`Ít nhất ${PASSWORD_MIN} ký tự`}
        required
      />
      <label htmlFor="confirm">Nhập lại mật khẩu</label>
      <input
        id="confirm"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
        required
      />
      {error && <p className="error">{error}</p>}
      <Button type="submit" disabled={register.isPending}>
        {register.isPending ? 'Đang tạo tài khoản…' : 'Đăng ký'}
      </Button>
      <p className="muted">
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </p>
    </form>
  );
}
