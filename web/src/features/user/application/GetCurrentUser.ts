import type { User } from '../domain/User';
import type { UserRepository } from '../domain/UserRepository';

export class GetCurrentUser {
  private readonly users: UserRepository;

  constructor(users: UserRepository) {
    this.users = users;
  }

  execute(): Promise<User> {
    return this.users.getCurrent();
  }
}
