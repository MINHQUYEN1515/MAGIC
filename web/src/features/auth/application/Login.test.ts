import { aUser, memoryTokenStore } from '@/agent/fixtures';
import type { AuthRepository } from '../domain/AuthRepository';
import { Login } from './Login';

const fakeRepo = (): AuthRepository => ({
  login: vi.fn().mockResolvedValue({ token: 'jwt', user: aUser() }),
  register: vi.fn(),
});

describe('Login', () => {
  it('chuẩn hoá email, đăng nhập và lưu JWT', async () => {
    const repo = fakeRepo();
    const tokens = memoryTokenStore();

    const session = await new Login(repo, tokens).execute({ email: '  A@Example.COM ', password: 'secret123' });

    expect(repo.login).toHaveBeenCalledWith({ email: 'a@example.com', password: 'secret123' });
    expect(session.user.name).toBe('Nguyễn Văn A');
    expect(tokens.get()).toBe('jwt');
  });

  it('từ chối email sai định dạng mà không gọi API', async () => {
    const repo = fakeRepo();

    await expect(new Login(repo, memoryTokenStore()).execute({ email: 'abc', password: 'x' })).rejects.toThrow(
      'Email không hợp lệ',
    );
    expect(repo.login).not.toHaveBeenCalled();
  });

  it('từ chối mật khẩu rỗng', async () => {
    const repo = fakeRepo();

    await expect(
      new Login(repo, memoryTokenStore()).execute({ email: 'a@example.com', password: '' }),
    ).rejects.toThrow('Vui lòng nhập mật khẩu');
    expect(repo.login).not.toHaveBeenCalled();
  });
});
