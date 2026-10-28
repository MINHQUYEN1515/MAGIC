import type { HttpClient } from '@/core/http/HttpClient';
import { UserApiRepository } from './UserApiRepository';

describe('UserApiRepository', () => {
  it('map DTO snake_case của backend sang entity', async () => {
    const http: HttpClient = {
      get: vi.fn().mockResolvedValue({
        id: 7,
        zalo_id: null,
        email: 'b@example.com',
        name: 'B',
        avatar: 'https://a/b.jpg',
        created_at: '2026-02-03T04:05:06Z',
        updated_at: '2026-02-03T04:05:06Z',
      }),
      post: vi.fn(),
    };

    const user = await new UserApiRepository(http).getCurrent();

    expect(http.get).toHaveBeenCalledWith('/me');
    expect(user).toEqual({
      id: 7,
      email: 'b@example.com',
      name: 'B',
      avatar: 'https://a/b.jpg',
      createdAt: new Date('2026-02-03T04:05:06Z'),
    });
  });
});
