import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Edit2,
  Save,
  ArrowLeft,
  Pill,
  Info,
  Shield,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateDosesForMedication } from '../utils/scheduleUtils';
import type { ExtractedPrescription, MedicationEntry, MedicationTiming } from '../types';
import './Verification.css';

const TIMING_OPTIONS: MedicationTiming[] = ['morning', 'afternoon', 'evening', 'night'];

export function Verification() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, upsertPrescription, addDoses } = useApp();

  const prescription = state.prescriptions.find(p => p.id === id);

  const [draft, setDraft] = useState<ExtractedPrescription | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hasUnresolved, setHasUnresolved] = useState(false);

  useEffect(() => {
    if (prescription?.extracted) {
      setDraft(JSON.parse(JSON.stringify(prescription.extracted)) as ExtractedPrescription);
    }
  }, [prescription]);

  useEffect(() => {
    if (!draft) return;
    const unresolved = draft.medications.some(
      m => m.unclear && m.unclearFields.some(f => ['medicineName', 'dose', 'frequency'].includes(f))
    );
    setHasUnresolved(unresolved);
  }, [draft]);

  if (!prescription) {
    return (
      <main className="page-content">
        <div className="container">
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p className="empty-title">Prescription not found</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Dashboard</button>
          </div>
        </div>
      </main>
    );
  }

  if (!prescription.extracted || !draft) {
    return (
      <main className="page-content">
        <div className="container">
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p className="empty-title">Prescription is still being processed</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Dashboard</button>
          </div>
        </div>
      </main>
    );
  }

  function updateMedication(medId: string, updates: Partial<MedicationEntry>) {
    if (!draft) return;
    setDraft({
      ...draft,
      medications: draft.medications.map(m =>
        m.id === medId ? { ...m, ...updates } : m
      ),
    });
  }

  function toggleTiming(medId: string, timing: MedicationTiming) {
    const med = draft?.medications.find(m => m.id === medId);
    if (!med) return;
    const already = med.timings.includes(timing);
    updateMedication(medId, {
      timings: already ? med.timings.filter(t => t !== timing) : [...med.timings, timing],
    });
  }

  function clearUnclear(medId: string) {
    updateMedication(medId, { unclear: false, unclearFields: [] });
  }

  async function handleVerify() {
    if (!draft || !prescription) return;
    if (hasUnresolved) return;

    // Save verified data and activate prescription
    const updatedRx = {
      ...prescription,
      status: 'active' as const,
      verified: draft,
    };
    upsertPrescription(updatedRx);

    // Generate dose schedule for next 7 days for all clear medications
    const clearMeds = draft.medications.filter(m => !m.unclear);
    const doses = clearMeds.flatMap(med =>
      generateDosesForMedication(med, prescription.id, 7)
    );
    addDoses(doses);

    navigate('/routine');
  }

  const confidenceBadge: Record<string, string> = {
    high: 'badge-success',
    medium: 'badge-warning',
    low: 'badge-danger',
    unclear: 'badge-unclear',
  };

  return (
    <main className="page-content verify-page">
      <div className="container">
        {/* ─── Header ─── */}
        <div className="verify-header animate-fade-in">
          <button id="back-btn" className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft size={16} aria-hidden="true" /> Back
          </button>
          <div>
            <p className="section-label">Step 2 of 2 — Human Verification</p>
            <h1>Review Extracted Data</h1>
            <p className="verify-subtitle">
              Compare the AI extraction against the original prescription image. Correct any errors before creating a medication schedule.
            </p>
          </div>
        </div>

        {/* ─── Safety Notice ─── */}
        <div className="safety-notice animate-fade-in" role="alert">
          <Shield size={18} className="icon" aria-hidden="true" />
          <p>
            <strong>Human verification required.</strong> Do not activate this schedule if any instructions are unclear. Unclear fields must be clarified with a qualified healthcare professional.
          </p>
        </div>

        {/* ─── Demo Mode Banner ─── */}
        {prescription.extracted && (
          <div className="demo-banner animate-fade-in" role="note">
            <Info size={14} aria-hidden="true" />
            <span>
              AI Confidence:{' '}
              <span className={`badge ${confidenceBadge[prescription.extracted.confidence] ?? 'badge-muted'}`}>
                {prescription.extracted.confidence}
              </span>
              {prescription.extracted.extractionWarnings.length > 0 && (
                <> · {prescription.extracted.extractionWarnings[0]}</>
              )}
            </span>
          </div>
        )}

        <div className="verify-grid">

          {/* ─── Original Image ─── */}
          <section className="original-image-panel card" aria-labelledby="original-label">
            <h2 id="original-label" className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
              <ExternalLink size={16} aria-hidden="true" /> Original Prescription
            </h2>
            <img
              src={prescription.imageDataUrl}
              alt="Original prescription image for comparison"
              className="original-image"
            />
            {prescription.extracted.rawText && (
              <details className="raw-text-details">
                <summary className="raw-text-summary">View extracted raw text</summary>
                <pre className="raw-text">{prescription.extracted.rawText}</pre>
              </details>
            )}
          </section>

          {/* ─── Extracted Fields ─── */}
          <section className="extracted-panel" aria-labelledby="extracted-label">
            <h2 id="extracted-label" className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
              <Pill size={16} aria-hidden="true" /> Extracted Medications
              <span className="badge badge-muted">{draft.medications.length} found</span>
            </h2>

            {/* Patient info */}
            {(draft.patientName || draft.doctorName || draft.prescriptionDate) && (
              <div className="card info-card">
                <div className="info-row">
                  {draft.patientName && <InfoField label="Patient" value={draft.patientName} />}
                  {draft.doctorName && <InfoField label="Doctor" value={draft.doctorName} />}
                  {draft.prescriptionDate && <InfoField label="Date" value={draft.prescriptionDate} />}
                </div>
              </div>
            )}

            {/* Medications */}
            <div className="med-list stagger">
              {draft.medications.map(med => (
                <MedicationCard
                  key={med.id}
                  med={med}
                  isEditing={editingId === med.id}
                  onEdit={() => setEditingId(editingId === med.id ? null : med.id)}
                  onUpdate={updates => updateMedication(med.id, updates)}
                  onToggleTiming={timing => toggleTiming(med.id, timing)}
                  onClearUnclear={() => clearUnclear(med.id)}
                />
              ))}
            </div>

            {/* Unresolved warning */}
            {hasUnresolved && (
              <div className="unresolved-banner" role="alert">
                <AlertTriangle size={18} aria-hidden="true" />
                <div>
                  <p className="unresolved-title">Unresolved unclear fields</p>
                  <p className="unresolved-sub">
                    You cannot activate this schedule until all unclear medication fields are resolved. Please consult your healthcare professional.
                  </p>
                </div>
              </div>
            )}

            {/* Verify button */}
            <div className="verify-actions">
              <button
                id="verify-btn"
                className="btn btn-primary btn-lg"
                onClick={handleVerify}
                disabled={hasUnresolved}
                aria-label={hasUnresolved ? 'Cannot verify — unresolved fields present' : 'Verify and activate medication schedule'}
              >
                <CheckCircle size={18} aria-hidden="true" />
                {hasUnresolved ? 'Resolve All Fields to Continue' : 'Verify & Activate Schedule'}
              </button>
              {hasUnresolved && (
                <p className="verify-help">
                  All unclear fields must be manually corrected or removed before activating.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* ─── Sub-Components ──────────────────────────────────────────────────────── */

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-field">
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  );
}

function MedicationCard({
  med,
  isEditing,
  onEdit,
  onUpdate,
  onToggleTiming,
  onClearUnclear,
}: {
  med: MedicationEntry;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Partial<MedicationEntry>) => void;
  onToggleTiming: (t: MedicationTiming) => void;
  onClearUnclear: () => void;
}) {
  return (
    <div
      className={`med-card card ${med.unclear ? 'med-card--unclear' : ''}`}
      role="article"
      aria-label={`Medication: ${med.medicineName}`}
    >
      {/* Card header */}
      <div className="med-card-header">
        <div className="med-name-row">
          <Pill size={16} className="med-icon" aria-hidden="true" />
          {isEditing ? (
            <input
              className={`input med-name-input ${med.unclear && med.unclearFields.includes('medicineName') ? 'unclear-field' : ''}`}
              value={med.medicineName}
              onChange={e => onUpdate({ medicineName: e.target.value })}
              aria-label="Medicine name"
              id={`med-name-${med.id}`}
            />
          ) : (
            <span className="med-name">{med.medicineName}</span>
          )}
          {med.unclear && (
            <span className="badge badge-unclear">
              <AlertTriangle size={10} aria-hidden="true" /> Unclear
            </span>
          )}
        </div>
        <div className="med-card-actions">
          <button
            id={`edit-med-${med.id}`}
            className="btn btn-ghost btn-sm btn-icon"
            onClick={onEdit}
            aria-label={isEditing ? 'Save medication edits' : 'Edit this medication'}
            type="button"
          >
            {isEditing ? <Save size={14} aria-hidden="true" /> : <Edit2 size={14} aria-hidden="true" />}
          </button>
          {med.unclear && (
            <button
              id={`clear-unclear-${med.id}`}
              className="btn btn-ghost btn-sm btn-icon"
              onClick={onClearUnclear}
              aria-label="Mark as resolved"
              data-tooltip="Mark as resolved"
              type="button"
            >
              <Check size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Unclear fields notice */}
      {med.unclear && med.unclearFields.length > 0 && (
        <div className="unclear-notice" role="alert">
          <AlertTriangle size={14} aria-hidden="true" />
          <span>Unclear fields: {med.unclearFields.join(', ')}. Verify with original prescription and prescribing doctor.</span>
        </div>
      )}

      {/* Fields */}
      {isEditing ? (
        <div className="med-edit-grid">
          <EditField
            id={`strength-${med.id}`}
            label="Strength"
            value={med.strength ?? ''}
            unclear={med.unclearFields.includes('strength')}
            onChange={v => onUpdate({ strength: v || null })}
          />
          <EditField
            id={`dose-${med.id}`}
            label="Dose"
            value={med.dose ?? ''}
            unclear={med.unclearFields.includes('dose')}
            onChange={v => onUpdate({ dose: v || null })}
          />
          <EditField
            id={`frequency-${med.id}`}
            label="Frequency"
            value={med.frequency ?? ''}
            unclear={med.unclearFields.includes('frequency')}
            onChange={v => onUpdate({ frequency: v || null })}
          />
          <EditField
            id={`food-${med.id}`}
            label="Food instruction"
            value={med.foodInstruction ?? ''}
            unclear={false}
            onChange={v => onUpdate({ foodInstruction: v || null })}
          />
          <EditField
            id={`duration-${med.id}`}
            label="Duration"
            value={med.duration ?? ''}
            unclear={false}
            onChange={v => onUpdate({ duration: v || null })}
          />
          <div className="edit-field">
            <label className="edit-label">Timings</label>
            <div className="timing-chips">
              {TIMING_OPTIONS.map(t => (
                <button
                  key={t}
                  type="button"
                  id={`timing-${med.id}-${t}`}
                  className={`timing-chip ${med.timings.includes(t) ? 'timing-chip--active' : ''}`}
                  onClick={() => onToggleTiming(t)}
                  aria-pressed={med.timings.includes(t)}
                  aria-label={`${t} — ${med.timings.includes(t) ? 'selected' : 'not selected'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <dl className="med-fields">
          <MedField label="Strength" value={med.strength} unclear={med.unclearFields.includes('strength')} />
          <MedField label="Dose" value={med.dose} unclear={med.unclearFields.includes('dose')} />
          <MedField label="Frequency" value={med.frequency} unclear={med.unclearFields.includes('frequency')} />
          <MedField label="Food" value={med.foodInstruction} unclear={false} />
          <MedField label="Duration" value={med.duration} unclear={false} />
          <div className="med-field">
            <dt className="med-field-label">Timings</dt>
            <dd>
              {med.timings.length > 0
                ? med.timings.map(t => (
                    <span key={t} className="badge badge-primary" style={{ marginRight: '4px' }}>{t}</span>
                  ))
                : <span className="field-empty">—</span>
              }
            </dd>
          </div>
          {med.notes && (
            <div className="med-field">
              <dt className="med-field-label">Notes</dt>
              <dd className="field-value">{med.notes}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

function MedField({ label, value, unclear }: { label: string; value: string | null; unclear: boolean }) {
  return (
    <div className="med-field">
      <dt className="med-field-label">{label}</dt>
      <dd className={unclear ? 'field-unclear' : 'field-value'}>
        {value ?? <span className="field-empty">—</span>}
        {unclear && <AlertTriangle size={12} style={{ color: '#c084fc', marginLeft: 4 }} aria-hidden="true" />}
      </dd>
    </div>
  );
}

function EditField({
  id, label, value, unclear, onChange,
}: {
  id: string;
  label: string;
  value: string;
  unclear: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="edit-field">
      <label htmlFor={id} className="edit-label">
        {label}
        {unclear && <span className="unclear-tag"><AlertTriangle size={10} aria-hidden="true" /> unclear</span>}
      </label>
      <input
        id={id}
        className={`input ${unclear ? 'unclear-field' : ''}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={unclear ? 'Enter correct value…' : label}
        aria-label={label}
      />
    </div>
  );
}
