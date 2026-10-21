import { screen } from '@testing-library/react';
import type { GetCurrentUser } from '../application/GetCurrentUser';
import { HttpError } from '@/core/http/HttpError';
import { aUser } from '@/agent/fixtures';
import { renderWithProviders } from '@/agent/renderWithProviders';
import { ProfilePage } from './ProfilePage';

const fakeGetCurrentUser = (execute: () => Promise<unknown>) => ({ execute }) as unknown as GetCurrentUser;

describe('ProfilePage', () => {
  it('hiển thị thông tin người dùng', async () => {
    renderWithProviders(<ProfilePage />, {
      getCurrentUser: fakeGetCurrentUser(() => Promise.resolve(aUser({ name: 'Trần Thị C' }))),
    });

    expect(await screen.findByRole('heading', { name: 'Trần Thị C' })).toBeInTheDocument();
    expect(screen.getByText('Zalo ID: z-123')).toBeInTheDocument();
  });

  it('hiển thị lỗi từ backend', async () => {
    renderWithProviders(<ProfilePage />, {
      getCurrentUser: fakeGetCurrentUser(() => Promise.reject(new HttpError(404, 'không tìm thấy người dùng'))),
    });

    expect(await screen.findByText('không tìm thấy người dùng')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });
});
