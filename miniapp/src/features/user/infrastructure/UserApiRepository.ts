import type { HttpClient } from '@/core/http/HttpClient';
import type { User } from '../domain/User';
import type { UserRepository } from '../domain/UserRepository';
import { toUser, type UserDto } from './UserDto';

export class UserApiRepository implements UserRepository {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async getCurrent(): Promise<User> {
    return toUser(await this.http.get<UserDto>('/me'));
  }
}
