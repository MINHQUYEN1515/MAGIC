import type { AuthRepository } from '../domain/AuthRepository';
import { isValidEmail, normalizeEmail, type Credentials } from '../domain/Credentials';
import type { Session } from '../domain/Session';
import type { TokenStore } from '../domain/TokenStore';

export class Login {
  private readonly auth: AuthRepository;
  private readonly tokens: TokenStore;

  constructor(auth: AuthRepository, tokens: TokenStore) {
    this.auth = auth;
    this.tokens = tokens;
  }

  async execute({ email, password }: Credentials): Promise<Session> {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) throw new Error('Email không hợp lệ');
    if (!password) throw new Error('Vui lòng nhập mật khẩu');

    const session = await this.auth.login({ email: normalized, password });
    this.tokens.save(session.token);
    return session;
  }
}
