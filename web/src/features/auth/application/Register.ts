import type { AuthRepository } from '../domain/AuthRepository';
import {
  isValidEmail,
  normalizeEmail,
  PASSWORD_MAX,
  PASSWORD_MIN,
  type Registration,
} from '../domain/Credentials';
import type { Session } from '../domain/Session';
import type { TokenStore } from '../domain/TokenStore';

// Đăng ký xong backend trả luôn JWT → lưu lại như đăng nhập.
export class Register {
  private readonly auth: AuthRepository;
  private readonly tokens: TokenStore;

  constructor(auth: AuthRepository, tokens: TokenStore) {
    this.auth = auth;
    this.tokens = tokens;
  }

  async execute({ name, email, password }: Registration): Promise<Session> {
    const trimmedName = name.trim();
    const normalized = normalizeEmail(email);
    if (!trimmedName) throw new Error('Vui lòng nhập tên');
    if (!isValidEmail(normalized)) throw new Error('Email không hợp lệ');
    if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
      throw new Error(`Mật khẩu phải từ ${PASSWORD_MIN} đến ${PASSWORD_MAX} ký tự`);
    }

    const session = await this.auth.register({ name: trimmedName, email: normalized, password });
    this.tokens.save(session.token);
    return session;
  }
}
