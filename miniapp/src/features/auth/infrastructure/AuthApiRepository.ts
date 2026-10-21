import type { HttpClient } from '@/core/http/HttpClient';
import { toUser, type UserDto } from '@/features/user/infrastructure/UserDto';
import type { AuthRepository } from '../domain/AuthRepository';
import type { Session } from '../domain/Session';

type LoginResponseDto = { token: string; user: UserDto };

export class AuthApiRepository implements AuthRepository {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async loginWithZalo(accessToken: string): Promise<Session> {
    const res = await this.http.post<LoginResponseDto>('/auth/zalo', { access_token: accessToken });
    return { token: res.token, user: toUser(res.user) };
  }
}
