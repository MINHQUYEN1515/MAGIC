import { env } from '@/core/config/env';
import { FetchHttpClient } from '@/core/http/FetchHttpClient';
import { browserStorage } from '@/core/storage/KeyValueStorage';
import { LoginWithZalo } from '@/features/auth/application/LoginWithZalo';
import { Logout } from '@/features/auth/application/Logout';
import type { TokenStore } from '@/features/auth/domain/TokenStore';
import { AuthApiRepository } from '@/features/auth/infrastructure/AuthApiRepository';
import { StorageTokenStore } from '@/features/auth/infrastructure/StorageTokenStore';
import { GetCurrentUser } from '@/features/user/application/GetCurrentUser';
import { UserApiRepository } from '@/features/user/infrastructure/UserApiRepository';

// Composition root: nơi DUY NHẤT ghép interface (domain) với implementation (infrastructure).
export type Container = {
  tokenStore: TokenStore;
  loginWithZalo: LoginWithZalo;
  logout: Logout;
  getCurrentUser: GetCurrentUser;
};

type Options = {
  onUnauthorized?: () => void;
};

export function createContainer({ onUnauthorized }: Options = {}): Container {
  const tokenStore = new StorageTokenStore(browserStorage);
  const http = new FetchHttpClient({
    baseUrl: env.apiBaseUrl,
    getToken: () => tokenStore.get(),
    onUnauthorized: () => {
      tokenStore.clear();
      onUnauthorized?.();
    },
  });

  const authRepo = new AuthApiRepository(http);
  const userRepo = new UserApiRepository(http);

  return {
    tokenStore,
    loginWithZalo: new LoginWithZalo(authRepo, tokenStore),
    logout: new Logout(tokenStore),
    getCurrentUser: new GetCurrentUser(userRepo),
  };
}
