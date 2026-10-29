import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/agent/renderWithProviders';
import { services } from './content';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('hiển thị các section chính và toàn bộ dịch vụ', () => {
    renderWithProviders(<HomePage />, {});

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dịch vụ của chúng tôi' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cam kết từ Magic' })).toBeInTheDocument();
    for (const s of services) {
      expect(screen.getByRole('heading', { name: s.name })).toBeInTheDocument();
    }
  });

  it('nút đặt lịch dẫn tới trang đăng ký', () => {
    renderWithProviders(<HomePage />, {});

    expect(screen.getByRole('link', { name: 'Đặt lịch hẹn' })).toHaveAttribute('href', '/register');
  });
});
