import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Heart,
  UserCheck,
  ArrowRight,
  Info,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Login.css';

export function Login() {
  const navigate = useNavigate();
  const { updateUser } = useApp();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [name, setName] = useState('Monish Sambangi');
  const [email, setEmail] = useState('monish.care@example.com');
  const [password, setPassword] = useState('Caregiver@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotNotice, setShowForgotNotice] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email || !email.includes('@')) {
      setValidationError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setValidationError('Please enter your full name.');
      return;
    }

    // Update user profile in local state
    updateUser({
      name: mode === 'register' ? name : 'Monish (Family Caregiver)',
      email,
      isAuthenticated: true,
      isDemo: true,
    });

    navigate('/');
  };

  const handleQuickDemoLogin = () => {
    updateUser({
      name: 'Monish (Family Caregiver)',
      email: 'monish.care@example.com',
      isAuthenticated: true,
      isDemo: true,
    });
    navigate('/');
  };

  return (
    <main className="page-content login-page">
      <div className="login-card-container">
        
        {/* Friendly Healthcare Banner */}
        <section className="login-hero-card card animate-fade-in" aria-label="Welcome banner">
          <div className="hero-badge">
            <Heart size={16} className="heart-icon" aria-hidden="true" />
            <span>Family First Healthcare</span>
          </div>
          <h1>Welcome to RX-AID! 🌸</h1>
          <p className="login-tagline">
            Let's make everyday caregiving easier. Your family's care journey starts here.
          </p>

          <div className="elderly-benefits-list">
            <div className="benefit-item">
              <CheckCircle size={20} className="benefit-icon" aria-hidden="true" />
              <span>Easy-to-read daily medicine schedules</span>
            </div>
            <div className="benefit-item">
              <CheckCircle size={20} className="benefit-icon" aria-hidden="true" />
              <span>Doctor handwriting made clear with Google Gemini AI</span>
            </div>
            <div className="benefit-item">
              <CheckCircle size={20} className="benefit-icon" aria-hidden="true" />
              <span>Compare prices & order from trusted local pharmacies</span>
            </div>
          </div>

          {/* Demo Mode Notice */}
          <div className="demo-banner" style={{ marginTop: 'var(--space-6)' }} role="note">
            <Info size={16} aria-hidden="true" />
            <span>
              <strong>Demo Access Mode:</strong> You can sign in directly or use the one-click demo access to explore the caregiver dashboard immediately.
            </span>
          </div>
        </section>

        {/* Login / Register Form */}
        <section className="login-form-card card animate-fade-in" aria-labelledby="form-heading">
          <div className="form-mode-tabs" role="tablist">
            <button
              id="signin-tab"
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={`mode-tab ${mode === 'signin' ? 'mode-tab--active' : ''}`}
              onClick={() => { setMode('signin'); setValidationError(null); }}
            >
              Sign In
            </button>
            <button
              id="register-tab"
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={`mode-tab ${mode === 'register' ? 'mode-tab--active' : ''}`}
              onClick={() => { setMode('register'); setValidationError(null); }}
            >
              Create Account
            </button>
          </div>

          <h2 id="form-heading" className="form-title">
            {mode === 'signin' ? 'Welcome Back!' : 'Start Your Care Journey'}
          </h2>
          <p className="form-sub">
            {mode === 'signin'
              ? 'Enter your details below to access your family dashboard.'
              : 'Sign up to organize prescriptions and track daily doses.'}
          </p>

          {validationError && (
            <div className="error-alert" role="alert">
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {mode === 'register' && (
              <div className="form-field">
                <label htmlFor="user-name">Your Full Name</label>
                <input
                  id="user-name"
                  type="text"
                  className="input"
                  placeholder="e.g., Monish Sambangi"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-field">
              <label htmlFor="user-email">Email Address</label>
              <input
                id="user-email"
                type="email"
                className="input"
                placeholder="caregiver@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <div className="field-label-row">
                <label htmlFor="user-password">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    className="link-btn-simple"
                    onClick={() => setShowForgotNotice(true)}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="password-input-wrap">
                <input
                  id="user-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {showForgotNotice && (
              <div className="forgot-notice-banner animate-fade-in" role="status">
                <Info size={16} aria-hidden="true" />
                <span>
                  Demo Mode: You can sign in using any password or click Quick Demo Access below.
                </span>
              </div>
            )}

            <div className="remember-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                <span>Remember me on this tablet or phone</span>
              </label>
            </div>

            <button
              id="submit-auth-btn"
              type="submit"
              className="btn btn-primary btn-lg submit-auth-btn"
            >
              <span>{mode === 'signin' ? 'Sign In to RX-AID' : 'Create My Account'}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>

          <div className="auth-divider">
            <span>or use instant demo</span>
          </div>

          <button
            id="quick-demo-btn"
            type="button"
            className="btn btn-secondary btn-lg demo-access-btn"
            onClick={handleQuickDemoLogin}
          >
            <UserCheck size={20} className="demo-icon" aria-hidden="true" />
            <span>Quick Demo Access (Family Caregiver)</span>
          </button>

          <div className="trust-footer">
            <ShieldCheck size={16} aria-hidden="true" />
            <span>Secure & Private · Designed for Family Caregivers</span>
          </div>
        </section>

      </div>
    </main>
  );
}
