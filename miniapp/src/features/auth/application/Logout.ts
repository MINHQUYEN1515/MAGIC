import type { TokenStore } from '../domain/TokenStore';

export class Logout {
  private readonly tokens: TokenStore;

  constructor(tokens: TokenStore) {
    this.tokens = tokens;
  }

  execute(): void {
    this.tokens.clear();
  }
}
