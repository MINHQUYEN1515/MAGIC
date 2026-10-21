import { aUser } from '@/agent/fixtures';
import type { AuthRepository } from '../domain/AuthRepository';
import type { TokenStore } from '../domain/TokenStore';
import { LoginWithZalo } from './LoginWithZalo';

function memoryTokenStore(): TokenStore {
  let token: string | null = null;
  return { get: () => token, save: (t) => void (token = t), clear: () => void (token = null) };
}

describe('LoginWithZalo', () => {
  it('đăng nhập và lưu JWT', async () => {
    const repo: AuthRepository = { loginWithZalo: vi.fn().mockResolvedValue({ token: 'jwt', user: aUser() }) };
    const tokens = memoryTokenStore();

    const session = await new LoginWithZalo(repo, tokens).execute('  zalo-token  ');

    expect(repo.loginWithZalo).toHaveBeenCalledWith('zalo-token');
    expect(session.user.name).toBe('Nguyễn Văn A');
    expect(tokens.get()).toBe('jwt');
  });

  it('từ chối token rỗng mà không gọi API', async () => {
    const repo: AuthRepository = { loginWithZalo: vi.fn() };

    await expect(new LoginWithZalo(repo, memoryTokenStore()).execute('   ')).rejects.toThrow('Thiếu access token');
    expect(repo.loginWithZalo).not.toHaveBeenCalled();
  });
});
