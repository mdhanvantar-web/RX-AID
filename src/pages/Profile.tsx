import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Heart,
  MapPin,
  Phone,
  Mail,
  Globe,
  Save,
  LogOut,
  CheckCircle,
  FileText,
  Shield,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Profile.css';

export function Profile() {
  const navigate = useNavigate();
  const { state, updateUser, setLanguage, logout } = useApp();
  const { user, patient, language, prescriptions, orders } = state;

  const [userName, setUserName] = useState(user.name);
  const [userPhone, setUserPhone] = useState(user.phone);
  const [deliveryAddress, setDeliveryAddress] = useState(user.deliveryAddress);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: userName,
      phone: userPhone,
      deliveryAddress,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <main className="page-content profile-page">
      <div className="container">
        
        {/* Header */}
        <header className="profile-header animate-fade-in">
          <div>
            <p className="section-label">Caregiver Account</p>
            <h1>My Profile & Family Settings 👤</h1>
            <p className="profile-subtitle">
              Manage your family caregiver profile, patient details, and default delivery preferences.
            </p>
          </div>

          <button
            id="logout-btn"
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleLogout}
          >
            <LogOut size={16} aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </header>

        {savedNotice && (
          <div className="save-success-banner animate-fade-in" role="status">
            <CheckCircle size={18} aria-hidden="true" />
            <span>Your caregiver profile and delivery preferences have been updated!</span>
          </div>
        )}

        <div className="profile-grid">
          
          {/* Caregiver Form */}
          <section className="card profile-form-card" aria-labelledby="caregiver-heading">
            <h2 id="caregiver-heading" className="card-title">
              <User size={20} aria-hidden="true" />
              Caregiver Information
            </h2>
            <p className="card-sub">
              Your details as the registered primary family caregiver.
            </p>

            <form onSubmit={handleSaveProfile} className="profile-form">
              <div className="form-field">
                <label htmlFor="edit-name">Caregiver Name</label>
                <div className="field-input-icon-wrap">
                  <User size={18} className="field-icon" aria-hidden="true" />
                  <input
                    id="edit-name"
                    type="text"
                    className="input has-icon"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="edit-email">Email Address</label>
                <div className="field-input-icon-wrap">
                  <Mail size={18} className="field-icon" aria-hidden="true" />
                  <input
                    id="edit-email"
                    type="email"
                    className="input has-icon"
                    value={user.email}
                    disabled
                  />
                </div>
                <span className="field-hint">Primary email used for medicine order receipts</span>
              </div>

              <div className="form-field">
                <label htmlFor="edit-phone">Contact Phone</label>
                <div className="field-input-icon-wrap">
                  <Phone size={18} className="field-icon" aria-hidden="true" />
                  <input
                    id="edit-phone"
                    type="tel"
                    className="input has-icon"
                    value={userPhone}
                    onChange={e => setUserPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="edit-address">Default Medicine Delivery Address</label>
                <div className="field-input-icon-wrap">
                  <MapPin size={18} className="field-icon" aria-hidden="true" />
                  <textarea
                    id="edit-address"
                    className="input has-icon"
                    rows={3}
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                id="save-profile-btn"
                type="submit"
                className="btn btn-primary btn-lg save-btn"
              >
                <Save size={18} aria-hidden="true" />
                <span>Save Profile Changes</span>
              </button>
            </form>
          </section>

          {/* Patient Details & Quick Stats Sidebar */}
          <aside className="profile-sidebar" aria-label="Patient and settings summary">
            
            {/* Patient Card */}
            <div className="card patient-summary-card">
              <div className="patient-summary-header">
                <div className="patient-avatar-box" aria-hidden="true">
                  <Heart size={24} />
                </div>
                <div>
                  <span className="section-label" style={{ marginBottom: 0 }}>Registered Patient</span>
                  <h3 className="patient-summary-name">{patient.name}</h3>
                  <span className="patient-rel">{patient.age} yrs · {patient.relationship}</span>
                </div>
              </div>

              <div className="patient-conditions-list">
                <span className="cond-label">Chronic Conditions:</span>
                <div className="cond-tags">
                  {patient.conditions.map(c => (
                    <span key={c} className="badge badge-primary">{c}</span>
                  ))}
                </div>
              </div>

              <div className="doctor-contact-box">
                <span className="doctor-label">Prescribing Physician:</span>
                <p className="doctor-name">{patient.doctorName ?? 'Dr. Suresh Kumar, MD'}</p>
                <p className="doctor-phone">{patient.doctorPhone ?? '+91 98480 12345'}</p>
              </div>
            </div>

            {/* Language Preference Card */}
            <div className="card language-pref-card">
              <h3 className="card-title">
                <Globe size={18} aria-hidden="true" />
                Language Preference
              </h3>
              <p className="card-sub">
                Choose plain English or friendly Telugu (తెలుగు) for instructions and schedules.
              </p>

              <div className="lang-options-grid">
                <button
                  type="button"
                  className={`lang-option-btn ${language === 'en' ? 'lang-option-btn--active' : ''}`}
                  onClick={() => setLanguage('en')}
                >
                  <span className="lang-main">English</span>
                  <span className="lang-sub-text">Standard Plain English</span>
                </button>
                <button
                  type="button"
                  className={`lang-option-btn ${language === 'te' ? 'lang-option-btn--active' : ''}`}
                  onClick={() => setLanguage('te')}
                >
                  <span className="lang-main">తెలుగు (Telugu)</span>
                  <span className="lang-sub-text">ఆంధ్రప్రదేశ్ & తెలంగాణ</span>
                </button>
              </div>
            </div>

            {/* Quick Record Stats */}
            <div className="card records-stats-card">
              <div className="stat-pill-row">
                <div className="record-stat-item">
                  <FileText size={18} className="stat-icon" aria-hidden="true" />
                  <div>
                    <span className="stat-num">{prescriptions.length}</span>
                    <span className="stat-desc">Prescriptions Scanned</span>
                  </div>
                </div>
                <div className="record-stat-item">
                  <Shield size={18} className="stat-icon" aria-hidden="true" />
                  <div>
                    <span className="stat-num">{orders.length}</span>
                    <span className="stat-desc">Pharmacy Orders</span>
                  </div>
                </div>
              </div>
            </div>

          </aside>

        </div>
      </div>
    </main>
  );
}
