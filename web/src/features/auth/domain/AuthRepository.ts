import type { Credentials, Registration } from './Credentials';
import type { Session } from './Session';

export interface AuthRepository {
  login(credentials: Credentials): Promise<Session>;
  register(registration: Registration): Promise<Session>;
}
