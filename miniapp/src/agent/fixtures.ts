import type { User } from '@/features/user/domain/User';

export const aUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  zaloId: 'z-123',
  name: 'Nguyễn Văn A',
  avatar: '',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});
