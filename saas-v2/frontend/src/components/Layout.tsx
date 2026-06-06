import { Outlet } from 'react-router-dom';
import { Link, useLocation } from 'react-router-dom';

export function Layout() {
  const location = useLocation();
  const nav = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/editor/new', label: 'Editor' },
    { to: '/templates', label: 'Templates' },
    { to: '/media', label: 'Media' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/billing', label: 'Billing' },
    { to: '/settings', label: 'Settings' },
  ];
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 h-full w-64 border-r bg-white">
        <div className="p-5 text-xl font-bold">SiteForge</div>
        <nav className="space-y-1 px-3">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                location.pathname.startsWith(item.to) ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
