import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ScanLine, ClipboardList, Shield } from 'lucide-react';
import './Navbar.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/scan', label: 'Scan', icon: ScanLine, end: false },
  { to: '/routine', label: 'Routine', icon: ClipboardList, end: false },
];

export function Navbar() {
  const location = useLocation();

  return (
    <header className="navbar" role="banner">
      <div className="navbar-inner container">
        {/* Brand */}
        <NavLink to="/" className="navbar-brand" aria-label="RX-AID Home">
          <div className="brand-icon" aria-hidden="true">
            <Shield size={18} strokeWidth={2.5} />
          </div>
          <span className="brand-name">RX<span className="brand-accent">-AID</span></span>
        </NavLink>

        {/* Desktop Nav */}
        <nav className="navbar-links" role="navigation" aria-label="Main navigation">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link--active' : ''}`
              }
              aria-current={location.pathname === to ? 'page' : undefined}
            >
              <Icon size={16} strokeWidth={2} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Status pill */}
        <div className="navbar-status" aria-label="AI status">
          <div className="status-dot-live" aria-hidden="true" />
          <span>Gemini AI</span>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav" role="navigation" aria-label="Mobile navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `mobile-nav-item ${isActive ? 'mobile-nav-item--active' : ''}`
            }
            aria-label={label}
          >
            <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
