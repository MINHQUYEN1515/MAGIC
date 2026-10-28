import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { aUser } from '@/agent/fixtures';
import { renderWithProviders } from '@/agent/renderWithProviders';
import { HttpError } from '@/core/http/HttpError';
import type { Register } from '../application/Register';
import { RegisterPage } from './RegisterPage';

const fakeRegister = (execute: Register['execute']) => ({ execute }) as unknown as Register;

async function fillForm(confirm = 'secret123') {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Tên'), 'An');
  await user.type(screen.getByLabelText('Email'), 'an@example.com');
  await user.type(screen.getByLabelText('Mật khẩu'), 'secret123');
  await user.type(screen.getByLabelText('Nhập lại mật khẩu'), confirm);
  await user.click(screen.getByRole('button', { name: 'Đăng ký' }));
}

describe('RegisterPage', () => {
  it('gửi tên, email, mật khẩu (không gửi mật khẩu nhập lại)', async () => {
    const execute = vi.fn().mockResolvedValue({ token: 'jwt', user: aUser() });
    renderWithProviders(<RegisterPage />, { register: fakeRegister(execute) });

    await fillForm();

    expect(execute).toHaveBeenCalledWith({ name: 'An', email: 'an@example.com', password: 'secret123' });
  });

  it('báo lỗi khi mật khẩu nhập lại không khớp', async () => {
    const execute = vi.fn();
    renderWithProviders(<RegisterPage />, { register: fakeRegister(execute) });

    await fillForm('khac-hoan-toan');

    expect(screen.getByText('Mật khẩu nhập lại không khớp')).toBeInTheDocument();
    expect(execute).not.toHaveBeenCalled();
  });

  it('hiển thị lỗi từ backend', async () => {
    const execute = vi.fn().mockRejectedValue(new HttpError(409, 'email đã được sử dụng'));
    renderWithProviders(<RegisterPage />, { register: fakeRegister(execute) });

    await fillForm();

    expect(await screen.findByText('email đã được sử dụng')).toBeInTheDocument();
  });
});
