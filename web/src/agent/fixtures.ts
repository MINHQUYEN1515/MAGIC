import type { User } from '@/features/user/domain/User';
import type { TokenStore } from '@/features/auth/domain/TokenStore';

export const aUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: 'a@example.com',
  name: 'Nguyễn Văn A',
  avatar: '',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

export function memoryTokenStore(): TokenStore {
  let token: string | null = null;
  return { get: () => token, save: (t) => void (token = t), clear: () => void (token = null) };
}
