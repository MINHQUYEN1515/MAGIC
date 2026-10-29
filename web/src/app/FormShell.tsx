import { Outlet } from 'react-router';

// Khung cho các trang form (đăng nhập, đăng ký, tài khoản): nền kem + thẻ ở giữa.
export function FormShell() {
  return (
    <section className="page">
      <div className="container">
        <Outlet />
      </div>
    </section>
  );
}
