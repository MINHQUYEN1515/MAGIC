import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { useDeps } from '@/app/di/useDeps';

const LEFT_LINKS = [
  { to: '/', label: 'Trang chủ' },
  { to: '/#gioi-thieu', label: 'Giới thiệu' },
  { to: '/#dich-vu', label: 'Dịch vụ' },
];

export function Layout() {
  const { tokenStore } = useDeps();
  // useLocation để header vẽ lại sau mỗi lần điều hướng (vd. vừa đăng nhập xong).
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const loggedIn = Boolean(tokenStore.get());

  const rightLinks = [
    { to: '/#cam-ket', label: 'Cam kết' },
    { to: '/#lien-he', label: 'Liên hệ' },
    loggedIn ? { to: '/profile', label: 'Tài khoản' } : { to: '/login', label: 'Đăng nhập' },
  ];

  const renderLinks = (links: { to: string; label: string }[]) =>
    links.map((l) => (
      <Link
        key={l.to}
        to={l.to}
        className={`nav-link${l.to === location.pathname + location.hash ? ' active' : ''}`}
        onClick={() => setMenuOpen(false)}
      >
        {l.label}
      </Link>
    ));

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <nav className="nav nav-left" aria-label="Điều hướng chính">
            {renderLinks(LEFT_LINKS)}
          </nav>
          <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
            <span className="brand-name">Magic</span>
            <span className="brand-tagline">Therapy · Wellness · Relaxation</span>
          </Link>
          <nav className="nav nav-right" aria-label="Tài khoản">
            {renderLinks(rightLinks)}
          </nav>
          <button
            type="button"
            className="menu-toggle"
            aria-label="Mở menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        {menuOpen && (
          <nav className="mobile-nav" aria-label="Menu di động">
            {renderLinks([...LEFT_LINKS, ...rightLinks])}
          </nav>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="footer" id="lien-he">
        <div className="footer-inner">
          <div>
            <h3>Magic – Vỗ về cơ thể, dịu êm tâm trí</h3>
            <p>
              Điểm dừng chân để chăm sóc bản thân trọn vẹn: kết hợp liệu pháp truyền thống và hiện đại, trong không
              gian riêng tư và tĩnh lặng.
            </p>
          </div>
          <div>
            <h3>Thời gian làm việc</h3>
            <p>Thứ Hai – Chủ Nhật: 9:00 – 22:00</p>
            <p>Email: hello@magic.vn</p>
            <Link to="/register" className="btn btn-dark footer-cta">
              Đặt lịch ngay
            </Link>
          </div>
          <div>
            <h3>Dịch vụ</h3>
            <ul>
              <li>Massage toàn thân</li>
              <li>Massage trị liệu</li>
              <li>Gội đầu dưỡng sinh</li>
              <li>Chăm sóc da mặt</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">Copyright {new Date().getFullYear()} © Magic. All Rights Reserved.</div>
      </footer>
    </>
  );
}
