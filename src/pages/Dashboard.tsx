import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ScanLine,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  ChevronRight,
  Pill,
  User,
  Activity,
  ShoppingCart,
  Scale,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTodayDoses, getTimingTime, getAdherenceRate, formatPrescriptionDate } from '../utils/scheduleUtils';
import { TRANSLATIONS, getTimingLabelFriendly } from '../utils/translations';
import type { MedicationTiming } from '../types';
import './Dashboard.css';

const TIMING_ORDER: MedicationTiming[] = ['morning', 'afternoon', 'evening', 'night'];

export function Dashboard() {
  const navigate = useNavigate();
  const { state, markDose } = useApp();
  const { patient, prescriptions, doses, language, user } = state;
  const t = TRANSLATIONS[language];

  const todayDoses = getTodayDoses(doses);
  const adherenceRate = getAdherenceRate(doses);
  const activePrescription = prescriptions.find(p => p.status === 'active') || prescriptions[0] || null;

  const takenToday = todayDoses.filter(d => d.status === 'taken').length;
  const totalToday = todayDoses.length;
  const missedToday = todayDoses.filter(d => d.status === 'missed').length;

  const today = format(new Date(), 'EEEE, d MMMM yyyy');

  return (
    <main className="page-content dashboard-page">
      <div className="container">

        {/* ─── Hero Section ─── */}
        <section className="dashboard-hero animate-fade-in" aria-labelledby="dashboard-welcome">
          <div className="hero-content">
            <span className="section-label">Family Caregiver Dashboard</span>
            <h1 id="dashboard-welcome">
              {t['dashboard.welcome']} <span className="text-highlight">{user.name.split(' ')[0]}</span> 🌿
            </h1>
            <p className="hero-sub">{t['dashboard.greeting_sub']}</p>
            <p className="hero-date">{today}</p>
          </div>

          <div className="hero-actions">
            <button
              id="quick-scan-btn"
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/scan')}
              aria-label="Scan a new prescription"
            >
              <ScanLine size={22} aria-hidden="true" />
              <span>{t['dashboard.scan_btn']}</span>
            </button>
          </div>
        </section>

        {/* ─── Patient Profile Card ─── */}
        <section className="patient-card card animate-fade-in" aria-labelledby="patient-name">
          <div className="patient-avatar-box" aria-hidden="true">
            <User size={30} />
          </div>
          <div className="patient-info">
            <span className="section-label" style={{ marginBottom: 0 }}>Registered Patient</span>
            <h2 id="patient-name" className="patient-name">{patient.name}</h2>
            <div className="patient-meta">
              <span>{patient.age} years old</span>
              <span className="meta-dot" aria-hidden="true">•</span>
              <span>Relationship: <strong>{patient.relationship}</strong></span>
              {patient.conditions.map(c => (
                <span key={c} className="badge badge-primary">{c}</span>
              ))}
            </div>
          </div>

          {/* Adherence Ring with Clear Contrast */}
          <div className="adherence-ring-box" role="img" aria-label={`Medication adherence: ${adherenceRate}%`}>
            <svg viewBox="0 0 44 44" className="ring-svg" aria-hidden="true">
              <circle cx="22" cy="22" r="18" fill="none" stroke="#e2e8f0" strokeWidth="4" />
              <circle
                cx="22" cy="22" r="18" fill="none"
                stroke="var(--color-primary)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(adherenceRate / 100) * 113.1} 113.1`}
                strokeDashoffset="28.27"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div className="ring-content">
              <span className="ring-pct">{adherenceRate}%</span>
              <span className="ring-sub">adherence</span>
            </div>
          </div>
        </section>

        {/* ─── Fast Caregiver Action Banners ─── */}
        <section className="quick-services-row animate-fade-in" aria-label="Caregiver Quick Services">
          <div className="service-card card card--clickable" onClick={() => navigate('/pharmacies')}>
            <div className="service-icon pharmacy-tint" aria-hidden="true">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h3>Order Prescribed Medicines</h3>
              <p>Explore 5 verified local pharmacies with home delivery support.</p>
            </div>
            <ChevronRight size={20} className="service-arrow" aria-hidden="true" />
          </div>

          <div className="service-card card card--clickable" onClick={() => navigate('/compare')}>
            <div className="service-icon compare-tint" aria-hidden="true">
              <Scale size={24} />
            </div>
            <div>
              <h3>Compare Medicine Prices</h3>
              <p>Find the lowest total price across local and express pharmacies.</p>
            </div>
            <ChevronRight size={20} className="service-arrow" aria-hidden="true" />
          </div>
        </section>

        {/* ─── Stats Row ─── */}
        <section className="stats-grid stagger" aria-label="Today's medication summary">
          <div className="stat-card card">
            <div className="stat-icon-wrap stat-icon--success" aria-hidden="true">
              <CheckCircle size={22} />
            </div>
            <div className="stat-value">{takenToday} / {totalToday}</div>
            <div className="stat-label">Taken Today</div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon-wrap stat-icon--danger" aria-hidden="true">
              <AlertTriangle size={22} />
            </div>
            <div className="stat-value" style={{ color: missedToday > 0 ? 'var(--color-danger)' : 'inherit' }}>
              {missedToday}
            </div>
            <div className="stat-label">Missed Doses</div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon-wrap stat-icon--primary" aria-hidden="true">
              <TrendingUp size={22} />
            </div>
            <div className="stat-value">{adherenceRate}%</div>
            <div className="stat-label">7-Day Adherence</div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon-wrap stat-icon--neutral" aria-hidden="true">
              <Activity size={22} />
            </div>
            <div className="stat-value">{prescriptions.length}</div>
            <div className="stat-label">Verified Rx Files</div>
          </div>
        </section>

        <div className="dashboard-main-grid">
          {/* ─── Today's Timeline ─── */}
          <section className="card timeline-card" aria-labelledby="today-timeline">
            <div className="card-header">
              <h2 id="today-timeline" className="card-title">
                <Clock size={20} aria-hidden="true" />
                <span>{t['dashboard.todays_medicines']}</span>
              </h2>
              {totalToday > 0 && (
                <span className="badge badge-primary">{totalToday} scheduled doses</span>
              )}
            </div>

            {totalToday === 0 ? (
              <div className="empty-state">
                <div className="empty-icon" aria-hidden="true">💊</div>
                <p className="empty-title">No medicines scheduled for today</p>
                <p className="empty-sub">Scan a doctor's prescription to automatically create safe daily care routines.</p>
                <button
                  id="empty-scan-btn"
                  className="btn btn-primary"
                  onClick={() => navigate('/scan')}
                >
                  <ScanLine size={18} aria-hidden="true" />
                  <span>Scan Prescription</span>
                </button>
              </div>
            ) : (
              <div className="timeline-groups-list" role="list">
                {TIMING_ORDER.map(timing => {
                  const timingDoses = todayDoses.filter(d => d.scheduledTime === timing);
                  if (timingDoses.length === 0) return null;
                  return (
                    <div key={timing} className="timing-block" role="listitem">
                      <div className="timing-header-row">
                        <span className="timing-title-text">
                          {getTimingLabelFriendly(timing, language)}
                        </span>
                        <span className="timing-window-tag">Target: {getTimingTime(timing)}</span>
                      </div>

                      <div className="doses-sublist">
                        {timingDoses.map(dose => (
                          <div
                            key={dose.id}
                            className={`dose-card dose-card--${dose.status}`}
                          >
                            <div className="dose-left-info">
                              <div className="dose-bullet" aria-hidden="true">
                                <Pill size={16} />
                              </div>
                              <div>
                                <h3 className="dose-medicine-title">{dose.medicineName}</h3>
                                <span className={`dose-status-tag status-text--${dose.status}`}>
                                  {dose.status === 'taken' && '✓ Taken'}
                                  {dose.status === 'missed' && '✗ Missed'}
                                  {dose.status === 'pending' && 'Scheduled for today'}
                                  {dose.status === 'skipped' && '— Skipped'}
                                </span>
                              </div>
                            </div>

                            {dose.status === 'pending' && (
                              <div className="dose-action-buttons">
                                <button
                                  id={`dose-taken-${dose.id}`}
                                  className="btn btn-success btn-sm"
                                  onClick={() => markDose(dose.id, 'taken')}
                                  aria-label={`Mark ${dose.medicineName} as taken`}
                                >
                                  {t['dashboard.mark_taken']}
                                </button>
                                <button
                                  id={`dose-skip-${dose.id}`}
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => markDose(dose.id, 'skipped')}
                                  aria-label={`Skip ${dose.medicineName}`}
                                >
                                  {t['dashboard.mark_skip']}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ─── Prescription History ─── */}
          <aside className="card rx-history-card" aria-labelledby="rx-history-heading">
            <div className="card-header">
              <h2 id="rx-history-heading" className="card-title">
                <Sparkles size={20} aria-hidden="true" />
                Prescriptions
              </h2>
              <button
                id="add-rx-shortcut"
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/scan')}
              >
                + Add New
              </button>
            </div>

            {prescriptions.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>
                <p className="empty-sub">No prescriptions uploaded yet.</p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/scan')}
                  style={{ marginTop: 'var(--space-2)' }}
                >
                  Upload First Prescription
                </button>
              </div>
            ) : (
              <div className="rx-items-list" role="list">
                {prescriptions.slice(0, 5).map(rx => (
                  <div
                    key={rx.id}
                    className="rx-card-item"
                    role="listitem"
                    onClick={() => navigate(`/verify/${rx.id}`)}
                  >
                    <div className="rx-thumb-box">
                      {rx.imageDataUrl ? (
                        <img src={rx.imageDataUrl} alt="" className="rx-thumb-img" />
                      ) : (
                        <Activity size={18} />
                      )}
                    </div>
                    <div className="rx-details">
                      <span className="rx-patient-label">
                        {rx.verified?.patientName ?? rx.extracted?.patientName ?? rx.imageFileName}
                      </span>
                      <span className="rx-date-label">{formatPrescriptionDate(rx.uploadedAt)}</span>
                    </div>
                    <span className={`badge badge-${rx.status === 'active' ? 'success' : rx.status === 'error' ? 'danger' : 'muted'}`}>
                      {rx.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>

        {/* ─── Pending Verification Notice ─── */}
        {activePrescription && activePrescription.status !== 'active' && (
          <div className="safety-notice animate-fade-in" style={{ marginTop: 'var(--space-6)' }} role="alert">
            <AlertTriangle size={20} className="icon" aria-hidden="true" />
            <p>
              You have a prescription waiting for your review.{' '}
              <button
                className="link-btn"
                onClick={() => navigate(`/verify/${activePrescription.id}`)}
              >
                Verify & create daily routine now →
              </button>
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
