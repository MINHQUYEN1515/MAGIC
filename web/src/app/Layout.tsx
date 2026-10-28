import { Link, Outlet } from 'react-router';

export function Layout() {
  return (
    <>
      <header className="header">
        <Link to="/" className="brand">
          Magic
        </Link>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
