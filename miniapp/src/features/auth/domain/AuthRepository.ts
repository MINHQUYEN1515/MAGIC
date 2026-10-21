import type { Session } from './Session';

export interface AuthRepository {
  loginWithZalo(accessToken: string): Promise<Session>;
}
