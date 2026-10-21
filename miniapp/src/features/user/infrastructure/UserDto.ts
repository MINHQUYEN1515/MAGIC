import type { User } from '../domain/User';

// Khớp JSON của backend/internal/modules/user/model.go
export type UserDto = {
  id: number;
  zalo_id: string;
  name: string;
  avatar: string;
  created_at: string;
  updated_at: string;
};

export function toUser(dto: UserDto): User {
  return {
    id: dto.id,
    zaloId: dto.zalo_id,
    name: dto.name,
    avatar: dto.avatar,
    createdAt: new Date(dto.created_at),
  };
}
