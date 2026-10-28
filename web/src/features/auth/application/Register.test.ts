import { aUser, memoryTokenStore } from '@/agent/fixtures';
import type { AuthRepository } from '../domain/AuthRepository';
import { Register } from './Register';

const fakeRepo = (): AuthRepository => ({
  login: vi.fn(),
  register: vi.fn().mockResolvedValue({ token: 'jwt', user: aUser() }),
});

describe('Register', () => {
  it('chuẩn hoá dữ liệu, đăng ký và lưu JWT', async () => {
    const repo = fakeRepo();
    const tokens = memoryTokenStore();

    await new Register(repo, tokens).execute({ name: ' An ', email: 'An@Example.com', password: 'secret123' });

    expect(repo.register).toHaveBeenCalledWith({ name: 'An', email: 'an@example.com', password: 'secret123' });
    expect(tokens.get()).toBe('jwt');
  });

  it.each([
    [{ name: ' ', email: 'a@example.com', password: 'secret123' }, 'Vui lòng nhập tên'],
    [{ name: 'An', email: 'a@', password: 'secret123' }, 'Email không hợp lệ'],
    [{ name: 'An', email: 'a@example.com', password: 'short' }, 'Mật khẩu phải từ 8 đến 72 ký tự'],
    [{ name: 'An', email: 'a@example.com', password: 'x'.repeat(73) }, 'Mật khẩu phải từ 8 đến 72 ký tự'],
  ])('từ chối %o mà không gọi API', async (input, message) => {
    const repo = fakeRepo();

    await expect(new Register(repo, memoryTokenStore()).execute(input)).rejects.toThrow(message);
    expect(repo.register).not.toHaveBeenCalled();
  });
});
