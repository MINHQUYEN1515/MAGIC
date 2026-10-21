import type { AuthRepository } from '../domain/AuthRepository';
import type { Session } from '../domain/Session';
import type { TokenStore } from '../domain/TokenStore';

export class LoginWithZalo {
  private readonly auth: AuthRepository;
  private readonly tokens: TokenStore;

  constructor(auth: AuthRepository, tokens: TokenStore) {
    this.auth = auth;
    this.tokens = tokens;
  }

  async execute(accessToken: string): Promise<Session> {
    const trimmed = accessToken.trim();
    if (!trimmed) throw new Error('Thiếu access token Zalo');

    const session = await this.auth.loginWithZalo(trimmed);
    this.tokens.save(session.token);
    return session;
  }
}
