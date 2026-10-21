import { Outlet } from 'react-router';

export function Layout() {
  return (
    <main className="container">
      <h1>Magic</h1>
      <Outlet />
    </main>
  );
}
