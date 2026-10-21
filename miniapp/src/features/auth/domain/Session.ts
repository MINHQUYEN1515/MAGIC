import type { User } from '@/features/user/domain/User';

export type Session = {
  token: string;
  user: User;
};
