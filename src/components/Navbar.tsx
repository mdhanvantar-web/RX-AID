import { NavLink } from 'react-router-dom';
import {
  Home,
  ScanLine,
  Pill,
  Store,
  Scale,
  ShoppingCart,
  PackageCheck,
  User,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../utils/translations';
import './Navbar.css';

export function Navbar() {
  const { state, setLanguage, cartCount } = useApp();
  const { language, user } = state;
  const t = TRANSLATIONS[language];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'te' : 'en');
  };

  const navItems = [
    { to: '/', label: t['nav.home'], icon: Home, end: true },
    { to: '/scan', label: t['nav.scan'], icon: ScanLine, end: false },
    { to: '/routine', label: t['nav.medicines'], icon: Pill, end: false },
    { to: '/pharmacies', label: t['nav.pharmacies'], icon: Store, end: false },
    { to: '/compare', label: t['nav.compare'], icon: Scale, end: false },
    { to: '/cart', label: t['nav.cart'], icon: ShoppingCart, end: false, badge: cartCount },
    { to: '/orders', label: t['nav.orders'], icon: PackageCheck, end: false },
    { to: '/profile', label: t['nav.profile'], icon: User, end: false },
  ];

  return (
    <header className="navbar" role="banner">
      <div className="navbar-container">
        
        {/* Brand */}
        <NavLink to="/" className="navbar-brand" aria-label="RX-AID Home">
          <div className="brand-icon-box" aria-hidden="true">
            <ShieldCheck size={24} strokeWidth={2.2} />
          </div>
          <div className="brand-text-group">
            <span className="brand-title">RX<span className="brand-title-accent">-AID</span></span>
            <span className="brand-sub">Caregiver Support</span>
          </div>
        </NavLink>

        {/* Desktop Primary Navigation */}
        <nav className="navbar-links" role="navigation" aria-label="Main Navigation">
          {navItems.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link--active' : ''}`
              }
            >
              <span className="nav-icon-wrap">
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
                {Boolean(badge && badge > 0) && (
                  <span className="nav-badge-count">{badge}</span>
                )}
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right Controls: Language Switcher & Profile/Login */}
        <div className="navbar-controls">
          <button
            type="button"
            className="lang-toggle-btn"
            onClick={toggleLanguage}
            title="Toggle between English and Telugu"
            aria-label={`Switch language. Current: ${language === 'en' ? 'English' : 'Telugu'}`}
          >
            <Globe size={16} aria-hidden="true" />
            <span className="lang-text">{language === 'en' ? 'తెలుగు' : 'English'}</span>
          </button>

          {user.isAuthenticated ? (
            <NavLink to="/profile" className="user-pill" title="Caregiver Profile">
              <span className="user-avatar-circle">
                {user.name.charAt(0)}
              </span>
              <span className="user-name-short">{user.name.split(' ')[0]}</span>
            </NavLink>
          ) : (
            <NavLink to="/login" className="btn btn-primary btn-sm">
              {t['nav.login']}
            </NavLink>
          )}
        </div>
      </div>

      {/* Mobile Accessible Bottom Nav Bar */}
      <nav className="mobile-bottom-bar" role="navigation" aria-label="Mobile Navigation">
        {navItems.slice(0, 5).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `mobile-nav-btn ${isActive ? 'mobile-nav-btn--active' : ''}`
            }
          >
            <Icon size={22} strokeWidth={2} aria-hidden="true" />
            <span className="mobile-btn-label">{label}</span>
          </NavLink>
        ))}
        <NavLink
          to="/cart"
          className={({ isActive }) =>
            `mobile-nav-btn ${isActive ? 'mobile-nav-btn--active' : ''}`
          }
        >
          <span className="nav-icon-wrap">
            <ShoppingCart size={22} strokeWidth={2} aria-hidden="true" />
            {cartCount > 0 && <span className="nav-badge-count">{cartCount}</span>}
          </span>
          <span className="mobile-btn-label">{t['nav.cart']}</span>
        </NavLink>
      </nav>
    </header>
  );
}
