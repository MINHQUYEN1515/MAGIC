import type { User } from './User';

export interface UserRepository {
  getCurrent(): Promise<User>;
}
