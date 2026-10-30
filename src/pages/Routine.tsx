import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, subDays } from 'date-fns';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Pill,
  Shield,
  Activity,
  Award,
  ShoppingCart,
  Scale,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getTimingTime,
  getAdherenceRate,
} from '../utils/scheduleUtils';
import { getTimingLabelFriendly } from '../utils/translations';
import type { MedicationTiming, DoseRecord, DoseStatus } from '../types';
import './Routine.css';

const TIMING_ORDER: MedicationTiming[] = ['morning', 'afternoon', 'evening', 'night'];

export function Routine() {
  const navigate = useNavigate();
  const { state, markDose } = useApp();
  const { doses, prescriptions, language } = state;

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const formattedDate = format(currentDate, 'yyyy-MM-dd');
  const displayDateStr = format(currentDate, 'EEEE, d MMMM yyyy');
  const isToday = format(new Date(), 'yyyy-MM-dd') === formattedDate;

  // Filter doses for selected day
  const dayDoses = useMemo(() => {
    return doses.filter(d => d.scheduledDate === formattedDate);
  }, [doses, formattedDate]);

  // Adherence calculation
  const overallAdherence = getAdherenceRate(doses);
  const takenCount = dayDoses.filter(d => d.status === 'taken').length;
  const missedCount = dayDoses.filter(d => d.status === 'missed').length;
  const totalCount = dayDoses.length;
  const dayAdherencePct = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  // Active verified medications
  const verifiedMedications = useMemo(() => {
    const list = [];
    for (const rx of prescriptions) {
      if (rx.status === 'active' && rx.verified?.medications) {
        for (const med of rx.verified.medications) {
          if (!med.unclear) {
            list.push({ ...med, rxDate: rx.uploadedAt, rxId: rx.id });
          }
        }
      }
    }
    return list;
  }, [prescriptions]);

  const handlePrevDay = () => setCurrentDate(prev => subDays(prev, 1));
  const handleNextDay = () => setCurrentDate(prev => addDays(prev, 1));
  const handleJumpToday = () => setCurrentDate(new Date());

  return (
    <main className="page-content routine-page">
      <div className="container">
        
        {/* Header */}
        <div className="routine-header animate-fade-in">
          <div>
            <p className="section-label">Caregiver Medication Log</p>
            <h1>My Prescribed Medicines 💊</h1>
            <p className="routine-subtitle">
              Verified daily routines organized into morning, afternoon, evening, and bedtime doses.
            </p>
          </div>

          <div className="routine-header-actions">
            <button
              id="order-from-routine-btn"
              className="btn btn-primary"
              onClick={() => navigate('/pharmacies')}
            >
              <ShoppingCart size={18} aria-hidden="true" />
              <span>Order from Pharmacies</span>
            </button>
            <button
              id="compare-from-routine-btn"
              className="btn btn-secondary"
              onClick={() => navigate('/compare')}
            >
              <Scale size={18} aria-hidden="true" />
              <span>Compare Prices</span>
            </button>
          </div>
        </div>

        {/* Date Selector Banner */}
        <section className="date-nav-card card animate-fade-in" aria-label="Date navigation">
          <div className="date-nav-controls">
            <button
              id="prev-day-btn"
              className="btn btn-ghost btn-sm btn-icon"
              onClick={handlePrevDay}
              aria-label="Previous day"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <div className="date-display">
              <Calendar size={20} className="calendar-icon" aria-hidden="true" />
              <span className="current-date-text">{displayDateStr}</span>
              {isToday && <span className="badge badge-primary">Today</span>}
            </div>
            <button
              id="next-day-btn"
              className="btn btn-ghost btn-sm btn-icon"
              onClick={handleNextDay}
              aria-label="Next day"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>

          {!isToday && (
            <button
              id="today-jump-btn"
              className="btn btn-secondary btn-sm"
              onClick={handleJumpToday}
              aria-label="Jump to today"
            >
              Return to Today
            </button>
          )}
        </section>

        {/* Quick Summary Row */}
        <section className="stats-grid stagger" aria-label="Daily adherence statistics">
          <div className="stat-card card">
            <div className="stat-icon-wrap stat-icon--neutral" aria-hidden="true">
              <Clock size={20} />
            </div>
            <div className="stat-value">{totalCount}</div>
            <div className="stat-label">Scheduled Doses</div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon-wrap stat-icon--success" aria-hidden="true">
              <CheckCircle size={20} />
            </div>
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>{takenCount}</div>
            <div className="stat-label">Taken Today</div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon-wrap stat-icon--danger" aria-hidden="true">
              <XCircle size={20} />
            </div>
            <div className="stat-value" style={{ color: missedCount > 0 ? 'var(--color-danger)' : 'inherit' }}>
              {missedCount}
            </div>
            <div className="stat-label">Missed Doses</div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon-wrap stat-icon--primary" aria-hidden="true">
              <Award size={20} />
            </div>
            <div className="stat-value" style={{ color: 'var(--color-primary-dark)' }}>
              {overallAdherence}%
            </div>
            <div className="stat-label">Overall Adherence</div>
          </div>
        </section>

        <div className="routine-layout-grid">
          
          {/* Main Timeline Sections */}
          <section className="routine-timeline-section card" aria-labelledby="routine-timeline-heading">
            <div className="card-header">
              <h2 id="routine-timeline-heading" className="card-title">
                <Activity size={20} aria-hidden="true" />
                Schedule for {isToday ? 'Today' : format(currentDate, 'MMM d')}
              </h2>
              {totalCount > 0 && (
                <span className="badge badge-primary">
                  {dayAdherencePct}% Completed
                </span>
              )}
            </div>

            {totalCount === 0 ? (
              <div className="empty-state">
                <div className="empty-icon" aria-hidden="true">📅</div>
                <p className="empty-title">No doses scheduled for this date</p>
                <p className="empty-sub">
                  Scan and verify a prescription to automatically generate safe 7-day medication routines.
                </p>
                <button
                  id="empty-routine-scan"
                  className="btn btn-primary"
                  onClick={() => navigate('/scan')}
                >
                  <Pill size={16} aria-hidden="true" />
                  Scan Prescription Now
                </button>
              </div>
            ) : (
              <div className="routine-time-blocks" role="list">
                {TIMING_ORDER.map(timing => {
                  const dosesInTiming = dayDoses.filter(d => d.scheduledTime === timing);
                  if (dosesInTiming.length === 0) return null;

                  return (
                    <div key={timing} className="time-block" role="listitem">
                      <div className="time-block-header">
                        <div className="time-block-info">
                          <span className="timing-title">
                            {getTimingLabelFriendly(timing, language)}
                          </span>
                          <span className="timing-window">Target Window: {getTimingTime(timing)}</span>
                        </div>
                      </div>

                      <div className="time-block-doses">
                        {dosesInTiming.map(dose => (
                          <RoutineDoseCard
                            key={dose.id}
                            dose={dose}
                            onMark={(status) => markDose(dose.id, status)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Active Verified Medications Overview */}
          <aside className="verified-meds-sidebar" aria-labelledby="active-meds-heading">
            <div className="card">
              <div className="card-header">
                <h2 id="active-meds-heading" className="card-title">
                  <Shield size={20} aria-hidden="true" />
                  Verified Prescriptions
                </h2>
                <span className="badge badge-success">{verifiedMedications.length} active</span>
              </div>

              {verifiedMedications.length === 0 ? (
                <div className="empty-sidebar">
                  <p className="empty-sub">No verified prescriptions yet.</p>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/scan')}
                  >
                    Scan Prescription
                  </button>
                </div>
              ) : (
                <div className="verified-med-items" role="list">
                  {verifiedMedications.map(med => (
                    <div key={med.id} className="verified-med-item" role="listitem">
                      <div className="verified-med-title-row">
                        <Pill size={16} className="med-icon" aria-hidden="true" />
                        <span className="verified-med-name">{med.medicineName}</span>
                        {med.strength && <span className="badge badge-muted">{med.strength}</span>}
                      </div>

                      <div className="verified-med-details">
                        {med.dose && <span><strong>Dose:</strong> {med.dose}</span>}
                        {med.frequency && <span><strong>Freq:</strong> {med.frequency}</span>}
                        {med.foodInstruction && <span><strong>Food:</strong> {med.foodInstruction}</span>}
                        {med.duration && <span><strong>Duration:</strong> {med.duration}</span>}
                      </div>

                      <div className="verified-timings-tags">
                        {med.timings.map(t => (
                          <span key={t} className="badge badge-primary">{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medical Disclaimer Reminder */}
            <div className="safety-notice" style={{ marginTop: 'var(--space-4)' }} role="note">
              <Shield size={18} className="icon" aria-hidden="true" />
              <p style={{ fontSize: '0.85rem' }}>
                RX-AID maintains your verified schedule. If symptoms change or adverse reactions occur, contact your healthcare provider immediately.
              </p>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}

function RoutineDoseCard({
  dose,
  onMark,
}: {
  dose: DoseRecord;
  onMark: (status: DoseStatus) => void;
}) {
  return (
    <article className={`routine-dose-item routine-dose-item--${dose.status}`}>
      <div className="dose-main">
        <div className="dose-left">
          <div className="dose-status-indicator" aria-hidden="true" />
          <div>
            <h3 className="dose-medicine-name">{dose.medicineName}</h3>
            <span className="dose-status-text">
              Status: <strong>{dose.status.toUpperCase()}</strong>
              {dose.takenAt && ` at ${format(new Date(dose.takenAt), 'h:mm a')}`}
            </span>
          </div>
        </div>

        <div className="dose-control-buttons">
          {dose.status !== 'taken' && (
            <button
              id={`mark-taken-${dose.id}`}
              className="btn btn-success btn-sm"
              onClick={() => onMark('taken')}
              aria-label={`Mark ${dose.medicineName} as taken`}
            >
              <CheckCircle size={16} aria-hidden="true" />
              Taken
            </button>
          )}

          {dose.status !== 'missed' && (
            <button
              id={`mark-missed-${dose.id}`}
              className="btn btn-danger btn-sm"
              onClick={() => onMark('missed')}
              aria-label={`Mark ${dose.medicineName} as missed`}
            >
              <XCircle size={16} aria-hidden="true" />
              Missed
            </button>
          )}

          {dose.status !== 'pending' && (
            <button
              id={`reset-status-${dose.id}`}
              className="btn btn-ghost btn-sm"
              onClick={() => onMark('pending')}
              aria-label={`Reset ${dose.medicineName} status to pending`}
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
