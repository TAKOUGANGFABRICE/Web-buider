import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠', title: 'Dashboard' },
  { to: '/gallery', label: 'Templates', icon: '📋', title: 'Template Gallery' },
  { to: '/builder', label: 'Builder', icon: '🧱', title: 'Website Builder' },
  { to: '/pages', label: 'Pages', icon: '📄', title: 'Page Management' },
  { to: '/blog', label: 'Blog', icon: '✍️', title: 'Blog Management' },
  { to: '/store', label: 'Store', icon: '🛍️', title: 'Storefront' },
  { to: '/media', label: 'Media', icon: '🖼️', title: 'Media Manager' },
  { to: '/analytics', label: 'Analytics', icon: '📊', title: 'Analytics Dashboard' },
  { to: '/forms', label: 'Forms', icon: '📝', title: 'Form Submissions' },
  { to: '/domains', label: 'Domains', icon: '🌐', title: 'Domain Management' },
  { to: '/billing', label: 'Billing', icon: '💳', title: 'Billing & Subscription' },
  { to: '/settings', label: 'Settings', icon: '⚙️', title: 'Settings' },
];

const Layout = ({ children }) => {
  const location = useLocation();

  const activeItem = navItems.find(item => item.to === location.pathname);
  const pageTitle = activeItem?.title || 'SiteForge';

  return (
    <div className="layout">
      <aside className="layout-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🚀</span>
          <span className="brand-text">SiteForge</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-link ${active ? 'active' : ''}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="layout-body">
        <header className="layout-topbar">
          <div className="topbar-left">
            <h2 className="page-title">{pageTitle}</h2>
          </div>
        </header>
        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;