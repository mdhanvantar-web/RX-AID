import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ScanLine,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  ChevronRight,
  Pill,
  User,
  Activity,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTodayDoses, getTimingLabel, getTimingTime, getAdherenceRate, formatPrescriptionDate } from '../utils/scheduleUtils';
import type { MedicationTiming } from '../types';
import './Dashboard.css';

const TIMING_ORDER: MedicationTiming[] = ['morning', 'afternoon', 'evening', 'night'];

const TIMING_ICONS: Record<MedicationTiming, string> = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌆',
  night: '🌙',
};

export function Dashboard() {
  const navigate = useNavigate();
  const { state, markDose } = useApp();
  const { patient, prescriptions, doses } = state;

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
            <p className="section-label">Caregiver Dashboard</p>
            <h1 id="dashboard-welcome">
              Hello, <span className="text-gradient">Caregiver</span>
            </h1>
            <p className="hero-date">{today}</p>
          </div>
          <button
            id="quick-scan-btn"
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/scan')}
            aria-label="Scan a new prescription"
          >
            <ScanLine size={20} aria-hidden="true" />
            Scan Prescription
          </button>
        </section>

        {/* ─── Patient Profile ─── */}
        <section className="patient-card card animate-fade-in" aria-labelledby="patient-name">
          <div className="patient-avatar" aria-hidden="true">
            <User size={28} />
          </div>
          <div className="patient-info">
            <p className="section-label" style={{ marginBottom: '2px' }}>Patient Profile</p>
            <h2 id="patient-name" className="patient-name">{patient.name}</h2>
            <div className="patient-meta">
              <span>{patient.age} years</span>
              <span className="dot" aria-hidden="true">•</span>
              <span>{patient.relationship}</span>
              {patient.conditions.map(c => (
                <span key={c} className="badge badge-muted">{c}</span>
              ))}
            </div>
          </div>
          <div className="adherence-ring" role="img" aria-label={`Medication adherence: ${adherenceRate}%`}>
            <svg viewBox="0 0 44 44" className="ring-svg" aria-hidden="true">
              <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border-default)" strokeWidth="3" />
              <circle
                cx="22" cy="22" r="18" fill="none"
                stroke="var(--color-primary)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(adherenceRate / 100) * 113.1} 113.1`}
                strokeDashoffset="28.27"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div className="ring-label">
              <span className="ring-pct">{adherenceRate}%</span>
              <span className="ring-sub">adherence</span>
            </div>
          </div>
        </section>

        {/* ─── Stats Row ─── */}
        <section className="stats-grid stagger" aria-label="Today's medication summary">
          <StatCard
            id="stat-taken"
            icon={<CheckCircle size={20} aria-hidden="true" />}
            label="Taken Today"
            value={`${takenToday} / ${totalToday}`}
            variant="success"
          />
          <StatCard
            id="stat-missed"
            icon={<AlertTriangle size={20} aria-hidden="true" />}
            label="Missed"
            value={String(missedToday)}
            variant={missedToday > 0 ? 'danger' : 'neutral'}
          />
          <StatCard
            id="stat-adherence"
            icon={<TrendingUp size={20} aria-hidden="true" />}
            label="7-Day Adherence"
            value={`${adherenceRate}%`}
            variant="primary"
          />
          <StatCard
            id="stat-prescriptions"
            icon={<Activity size={20} aria-hidden="true" />}
            label="Prescriptions"
            value={String(prescriptions.length)}
            variant="neutral"
          />
        </section>

        <div className="dashboard-main-grid">
          {/* ─── Today's Timeline ─── */}
          <section className="card timeline-card" aria-labelledby="today-timeline">
            <div className="card-header">
              <h2 id="today-timeline" className="card-title">
                <Clock size={18} aria-hidden="true" />
                Today's Medications
              </h2>
              {totalToday > 0 && (
                <span className="badge badge-muted">{totalToday} doses</span>
              )}
            </div>

            {totalToday === 0 ? (
              <EmptyTimeline onScan={() => navigate('/scan')} />
            ) : (
              <div className="timeline" role="list">
                {TIMING_ORDER.map(timing => {
                  const timingDoses = todayDoses.filter(d => d.scheduledTime === timing);
                  if (timingDoses.length === 0) return null;
                  return (
                    <div key={timing} className="timeline-group" role="listitem">
                      <div className="timing-header">
                        <span className="timing-emoji" aria-hidden="true">{TIMING_ICONS[timing]}</span>
                        <span className="timing-label">{getTimingLabel(timing)}</span>
                        <span className="timing-time">{getTimingTime(timing)}</span>
                      </div>
                      <div className="dose-list">
                        {timingDoses.map(dose => (
                          <div
                            key={dose.id}
                            className={`dose-item dose-item--${dose.status}`}
                            role="article"
                          >
                            <div className="dose-icon" aria-hidden="true">
                              <Pill size={14} />
                            </div>
                            <div className="dose-info">
                              <span className="dose-name">{dose.medicineName}</span>
                              <span className={`dose-status-label dose-status--${dose.status}`}>
                                {dose.status === 'taken' && '✓ Taken'}
                                {dose.status === 'missed' && '✗ Missed'}
                                {dose.status === 'pending' && 'Pending'}
                                {dose.status === 'skipped' && '— Skipped'}
                              </span>
                            </div>
                            {dose.status === 'pending' && (
                              <div className="dose-actions">
                                <button
                                  id={`dose-taken-${dose.id}`}
                                  className="btn btn-success btn-sm"
                                  onClick={() => markDose(dose.id, 'taken')}
                                  aria-label={`Mark ${dose.medicineName} as taken`}
                                >
                                  Taken
                                </button>
                                <button
                                  id={`dose-skip-${dose.id}`}
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => markDose(dose.id, 'skipped')}
                                  aria-label={`Skip ${dose.medicineName}`}
                                >
                                  Skip
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
          <section className="card prescription-history-card" aria-labelledby="prescription-history">
            <div className="card-header">
              <h2 id="prescription-history" className="card-title">
                <Calendar size={18} aria-hidden="true" />
                Prescriptions
              </h2>
              <button
                id="view-all-prescriptions-btn"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/scan')}
                aria-label="Add new prescription"
              >
                + Add
              </button>
            </div>

            {prescriptions.length === 0 ? (
              <EmptyPrescriptions onScan={() => navigate('/scan')} />
            ) : (
              <div className="prescription-list" role="list">
                {prescriptions.slice(0, 5).map(rx => (
                  <div key={rx.id} className="rx-item" role="listitem">
                    <div className="rx-thumb" aria-hidden="true">
                      {rx.imageDataUrl ? (
                        <img src={rx.imageDataUrl} alt="" className="rx-thumb-img" />
                      ) : (
                        <Activity size={16} />
                      )}
                    </div>
                    <div className="rx-info">
                      <span className="rx-name">
                        {rx.verified?.patientName ?? rx.extracted?.patientName ?? rx.imageFileName}
                      </span>
                      <span className="rx-date">{formatPrescriptionDate(rx.uploadedAt)}</span>
                    </div>
                    <span className={`badge badge-${rx.status === 'active' ? 'success' : rx.status === 'error' ? 'danger' : 'muted'}`}>
                      {rx.status}
                    </span>
                    <ChevronRight size={14} className="rx-chevron" aria-hidden="true" />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ─── Active Prescription Alert ─── */}
        {activePrescription && activePrescription.status !== 'active' && (
          <div className="safety-notice animate-fade-in" role="alert" aria-live="polite">
            <AlertTriangle size={18} className="icon" aria-hidden="true" />
            <p>
              You have a prescription pending verification.{' '}
              <button
                className="link-btn"
                onClick={() => navigate(`/verify/${activePrescription.id}`)}
              >
                Review and verify now →
              </button>
            </p>
          </div>
        )}

      </div>
    </main>
  );
}

function StatCard({
  id, icon, label, value, variant,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  variant: 'success' | 'danger' | 'primary' | 'neutral';
}) {
  const colorMap = {
    success: 'var(--color-success)',
    danger: 'var(--color-danger)',
    primary: 'var(--color-primary)',
    neutral: 'var(--text-secondary)',
  };
  return (
    <div id={id} className="stat-card card" role="group" aria-label={`${label}: ${value}`}>
      <div className="stat-icon" style={{ color: colorMap[variant] }} aria-hidden="true">{icon}</div>
      <div className="stat-value" style={{ color: colorMap[variant] }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function EmptyTimeline({ onScan }: { onScan: () => void }) {
  return (
    <div className="empty-state" role="status">
      <div className="empty-icon" aria-hidden="true">💊</div>
      <p className="empty-title">No medications scheduled today</p>
      <p className="empty-sub">Scan a prescription to create a daily routine.</p>
      <button id="empty-scan-btn" className="btn btn-primary" onClick={onScan}>
        <ScanLine size={16} aria-hidden="true" /> Scan Prescription
      </button>
    </div>
  );
}

function EmptyPrescriptions({ onScan }: { onScan: () => void }) {
  return (
    <div className="empty-state" role="status">
      <div className="empty-icon" aria-hidden="true">📋</div>
      <p className="empty-title">No prescriptions yet</p>
      <p className="empty-sub">Upload your first prescription to get started.</p>
      <button id="empty-rx-btn" className="btn btn-secondary btn-sm" onClick={onScan}>
        Upload →
      </button>
    </div>
  );
}
