import type { HttpClient } from '@/core/http/HttpClient';
import { toUser, type UserDto } from '@/features/user/infrastructure/UserDto';
import type { AuthRepository } from '../domain/AuthRepository';
import type { Credentials, Registration } from '../domain/Credentials';
import type { Session } from '../domain/Session';

type SessionDto = { token: string; user: UserDto };

export class AuthApiRepository implements AuthRepository {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async login(credentials: Credentials): Promise<Session> {
    return toSession(await this.http.post<SessionDto>('/auth/login', credentials));
  }

  async register(registration: Registration): Promise<Session> {
    return toSession(await this.http.post<SessionDto>('/auth/register', registration));
  }
}

function toSession(dto: SessionDto): Session {
  return { token: dto.token, user: toUser(dto.user) };
}
