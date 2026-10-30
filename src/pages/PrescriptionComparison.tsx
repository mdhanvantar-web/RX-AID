import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye,
  FileImage,
  Info,
  Scale,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  computePrescriptionComparison,
  getPrescriptionMedications,
} from '../services/prescriptionComparison';
import type {
  ComparedMedicine,
  ComparisonCategory,
  ComparisonFieldDiff,
  MedicationEntry,
} from '../types';
import './PrescriptionComparison.css';

const CATEGORY_ORDER: ComparisonCategory[] = [
  'needs_review',
  'changed',
  'added',
  'removed',
  'unchanged',
];

const CATEGORY_META: Record<
  ComparisonCategory,
  { label: string; emoji: string; className: string; description: string }
> = {
  needs_review: {
    label: 'Needs Review',
    emoji: '⚠️',
    className: 'cat-review',
    description:
      'The handwriting, medicine identity, or instructions are unclear. Please confirm these with the prescribing doctor or a pharmacist.',
  },
  changed: {
    label: 'Changed',
    emoji: '🟠',
    className: 'cat-changed',
    description:
      'These instructions differ between the two prescriptions. A difference is a review notice, not proof that the doctor intended a change.',
  },
  added: {
    label: 'Added',
    emoji: '🔵',
    className: 'cat-added',
    description:
      'These medicines appear only on the new prescription. Do not start them until the new prescription is verified.',
  },
  removed: {
    label: 'No Longer Listed',
    emoji: '🔴',
    className: 'cat-removed',
    description:
      'These medicines appear on the previous prescription but not the new one. This does not confirm they were stopped — keep following the earlier instructions until the doctor advises.',
  },
  unchanged: {
    label: 'Unchanged',
    emoji: '🟢',
    className: 'cat-unchanged',
    description: 'These medicine instructions appear consistent between the two prescriptions.',
  },
};

const FIELD_ROWS: Array<{ key: keyof MedicationEntry; label: string }> = [
  { key: 'strength', label: 'Strength' },
  { key: 'dose', label: 'Dose' },
  { key: 'frequency', label: 'Frequency' },
  { key: 'route', label: 'Route' },
  { key: 'foodInstruction', label: 'Food instruction' },
  { key: 'duration', label: 'Duration' },
];

type ImageView = 'previous' | 'new' | 'both' | null;

function formatDateTime(iso: string): string {
  try {
    return format(new Date(iso), 'dd MMM yyyy, h:mm a');
  } catch {
    return iso;
  }
}

function displayField(med: MedicationEntry | null, key: keyof MedicationEntry): string | null {
  if (!med) return null;
  if (key === 'timings') {
    if (!med.timings || med.timings.length === 0) return null;
    return med.timings.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
  }
  const value = med[key];
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  return null;
}

function reviewStatusFor(item: ComparedMedicine): { label: string; className: string } {
  switch (item.category) {
    case 'needs_review':
      return { label: 'Needs review with doctor', className: 'review-status--review' };
    case 'changed':
      return { label: 'Review with doctor before acting', className: 'review-status--changed' };
    case 'added':
      return { label: 'New medicine — confirm before starting', className: 'review-status--added' };
    case 'removed':
      return { label: 'Not confirmed stopped', className: 'review-status--removed' };
    default:
      return { label: 'Instructions appear consistent', className: 'review-status--ok' };
  }
}

export function PrescriptionComparison() {
  const { newId, baseId } = useParams<{ newId: string; baseId: string }>();
  const navigate = useNavigate();
  const { state, saveComparison, markComparisonReviewed } = useApp();
  const { prescriptions, comparisons } = state;

  const newPrescription = prescriptions.find(rx => rx.id === newId);
  const previousPrescription = prescriptions.find(rx => rx.id === baseId);

  const [imageView, setImageView] = useState<ImageView>(null);
  const [ackChecked, setAckChecked] = useState(false);
  const savedRef = useRef(false);

  const computed = useMemo(() => {
    if (!newPrescription || !previousPrescription) return null;
    return computePrescriptionComparison(
      getPrescriptionMedications(previousPrescription),
      getPrescriptionMedications(newPrescription)
    );
  }, [newPrescription, previousPrescription]);

  const existing = comparisons.find(
    c => c.previousPrescriptionId === baseId && c.newPrescriptionId === newId
  );

  const result = existing?.result ?? computed;

  useEffect(() => {
    if (!newPrescription || !previousPrescription || !computed || existing || savedRef.current) return;
    savedRef.current = true;
    saveComparison({
      id: `cmp-${newPrescription.id}-${previousPrescription.id}`,
      previousPrescriptionId: previousPrescription.id,
      newPrescriptionId: newPrescription.id,
      createdAt: new Date().toISOString(),
      status: 'pending',
      result: computed,
    });
  }, [computed, existing, newPrescription, previousPrescription, saveComparison]);

  if (!newPrescription || !previousPrescription || !result) {
    return (
      <main className="page-content">
        <div className="container">
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true"><Scale size={40} /></div>
            <p className="empty-title">Comparison not available</p>
            <p className="empty-sub">
              One of the prescription versions could not be found, or it does not have extracted
              medicines yet.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/prescriptions')}>
              Back to Prescription History
            </button>
          </div>
        </div>
      </main>
    );
  }

  const comparisonStatus = existing?.status ?? 'pending';
  const summary = result.summary;
  const hasChanges = summary.changed + summary.added + summary.removed > 0;

  const grouped = CATEGORY_ORDER.map(category => ({
    category,
    items: result.items.filter(item => item.category === category),
  })).filter(group => group.items.length > 0);

  const baseVersion = [...prescriptions]
    .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
    .findIndex(rx => rx.id === previousPrescription.id) + 1;
  const newVersion = [...prescriptions]
    .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
    .findIndex(rx => rx.id === newPrescription.id) + 1;

  return (
    <main className="page-content comparison-page">
      <div className="container">
        <header className="comparison-header animate-fade-in">
          <button
            type="button"
            className="btn btn-ghost btn-sm comparison-back"
            onClick={() => navigate('/prescriptions')}
          >
            <ArrowLeft size={16} aria-hidden="true" /> Prescription History
          </button>
          <div>
            <p className="section-label">Prescription Change Detector</p>
            <h1>Prescription Comparison</h1>
            <p className="comparison-subtitle">
              Version {baseVersion} compared with Version {newVersion}. Review each difference carefully
              with the original prescription images.
            </p>
          </div>
        </header>

        <div className="safety-notice comparison-safety animate-fade-in" role="alert">
          <ShieldCheck size={20} className="icon" aria-hidden="true" />
          <p>
            <strong>This is a review tool, not medical advice.</strong> A detected difference does not
            prove the doctor changed the medicine. Nothing is stopped, started, merged, or re-dosed
            automatically. Confirm every change with the prescribing doctor or a qualified healthcare
            professional before acting.
          </p>
        </div>

        {/* Summary */}
        <section className="comparison-summary" aria-label="Comparison summary">
          <div className="summary-card summary-card--total">
            <span className="summary-value">{summary.total}</span>
            <span className="summary-label">Total medicines compared</span>
          </div>
          <div className="summary-card summary-card--unchanged">
            <span className="summary-value">{summary.unchanged}</span>
            <span className="summary-label">🟢 Unchanged</span>
          </div>
          <div className="summary-card summary-card--added">
            <span className="summary-value">{summary.added}</span>
            <span className="summary-label">🔵 Added</span>
          </div>
          <div className="summary-card summary-card--changed">
            <span className="summary-value">{summary.changed}</span>
            <span className="summary-label">🟠 Changed</span>
          </div>
          <div className="summary-card summary-card--removed">
            <span className="summary-value">{summary.removed}</span>
            <span className="summary-label">🔴 No longer listed</span>
          </div>
          <div className="summary-card summary-card--review">
            <span className="summary-value">{summary.needsReview}</span>
            <span className="summary-label">⚠️ Needs review</span>
          </div>
        </section>

        {result.warnings.length > 0 && (
          <div className="comparison-warnings card" role="note">
            <AlertTriangle size={18} className="warn-icon" aria-hidden="true" />
            <ul>
              {result.warnings.map(warning => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Versions + original images */}
        <section className="versions-panel" aria-labelledby="versions-heading">
          <div className="versions-head">
            <h2 id="versions-heading" className="card-title">
              <FileImage size={20} aria-hidden="true" />
              Prescription Versions Compared
            </h2>
            <div className="versions-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setImageView('both')}
              >
                <Eye size={16} aria-hidden="true" />
                Compare original images
              </button>
              <span className={`badge ${comparisonStatus === 'reviewed' ? 'badge-success' : 'badge-warning'}`}>
                {comparisonStatus === 'reviewed' ? 'Differences reviewed' : 'Awaiting caregiver review'}
              </span>
            </div>
          </div>

          <div className="versions-grid">
            <div className="version-card card">
              <div className="version-card-top">
                <span className="version-label">Previous version</span>
                <span className="badge badge-muted">Version {baseVersion}</span>
              </div>
              <img
                src={previousPrescription.imageDataUrl}
                alt={`Previous prescription, version ${baseVersion}`}
                className="version-thumb"
              />
              <p className="version-date">{formatDateTime(previousPrescription.uploadedAt)}</p>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setImageView('previous')}
              >
                <Eye size={15} aria-hidden="true" /> View previous image
              </button>
            </div>

            <div className="version-arrow" aria-hidden="true">
              <ArrowRight size={26} />
            </div>

            <div className="version-card card version-card--new">
              <div className="version-card-top">
                <span className="version-label">New version</span>
                <span className="badge badge-warning">Version {newVersion} · unverified draft</span>
              </div>
              <img
                src={newPrescription.imageDataUrl}
                alt={`New prescription, version ${newVersion}`}
                className="version-thumb"
              />
              <p className="version-date">{formatDateTime(newPrescription.uploadedAt)}</p>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setImageView('new')}
              >
                <Eye size={15} aria-hidden="true" /> View new image
              </button>
            </div>
          </div>
        </section>

        {/* Grouped comparison results */}
        <div className="comparison-results">
          {grouped.map(group => {
            const meta = CATEGORY_META[group.category];
            return (
              <section
                key={group.category}
                className={`comparison-category ${meta.className}`}
                aria-labelledby={`cat-${group.category}`}
              >
                <div className="category-head">
                  <h2 id={`cat-${group.category}`} className="category-title">
                    <span aria-hidden="true">{meta.emoji}</span> {meta.label}
                    <span className="category-count">{group.items.length}</span>
                  </h2>
                  <p className="category-desc">{meta.description}</p>
                </div>

                <div className="medicine-comparison-list">
                  {group.items.map(item => (
                    <MedicineComparisonCard
                      key={item.id}
                      item={item}
                      onViewPrevious={() => setImageView('previous')}
                      onViewNew={() => setImageView('new')}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Caregiver review + continue */}
        <section className="review-action-card card" aria-labelledby="review-action-title">
          <h2 id="review-action-title" className="card-title">
            <CheckCircle size={20} aria-hidden="true" />
            Caregiver Review
          </h2>

          {comparisonStatus === 'pending' ? (
            <>
              <p className="review-action-text">
                Please review every difference above and both original prescription images. Marking
                this review does <strong>not</strong> confirm a medical change and does not activate the
                new prescription.
              </p>
              <label className="ack-row">
                <input
                  type="checkbox"
                  checked={ackChecked}
                  onChange={e => setAckChecked(e.target.checked)}
                />
                <span>
                  I have reviewed these differences. I will confirm any change with the prescribing
                  doctor or a qualified healthcare professional before acting.
                </span>
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                disabled={!ackChecked}
                onClick={() => {
                  if (existing) {
                    markComparisonReviewed(existing.id);
                  }
                  setAckChecked(false);
                }}
              >
                <CheckCircle size={18} aria-hidden="true" />
                Mark differences as reviewed
              </button>
            </>
          ) : (
            <p className="review-action-text review-action-text--done">
              <CheckCircle size={17} aria-hidden="true" /> You have marked these differences as
              reviewed. This is not a medical confirmation. The new prescription remains pending until
              its extracted instructions are verified.
            </p>
          )}

          <div className="review-action-footer">
            <div>
              <p className="review-action-hint">
                {newPrescription.status === 'active'
                  ? 'This version is verified and active.'
                  : 'The new version stays an unverified draft until you complete verification.'}
              </p>
              {hasChanges && (
                <p className="review-action-hint review-action-hint--warn">
                  <AlertTriangle size={14} aria-hidden="true" /> Do not stop any existing medicine
                  based on this comparison.
                </p>
              )}
            </div>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => navigate(`/verify/${newPrescription.id}`)}
            >
              {newPrescription.status === 'active' ? 'Open verified version' : 'Continue to verify new prescription'}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </section>

        <div className="comparison-footnote">
          <Info size={18} aria-hidden="true" />
          <p>
            Comparison created {formatDateTime(existing?.createdAt ?? result.generatedAt)}. Matching is
            cautious: similar spellings are flagged for review, and different names are never assumed
            to be the same medicine.
          </p>
        </div>

        {imageView && (
          <div
            className="image-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="comparison-image-title"
            onClick={() => setImageView(null)}
          >
            <div
              className={`image-modal-card card ${imageView === 'both' ? 'image-modal-card--wide' : ''}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="image-modal-head">
                <h2 id="comparison-image-title">
                  {imageView === 'both'
                    ? 'Original prescription images'
                    : imageView === 'previous'
                      ? `Previous prescription — Version ${baseVersion}`
                      : `New prescription — Version ${newVersion}`}
                </h2>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  onClick={() => setImageView(null)}
                  aria-label="Close original prescription image"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              <div className={imageView === 'both' ? 'image-pair' : ''}>
                {(imageView === 'both' || imageView === 'previous') && (
                  <figure className="image-figure">
                    <img
                      src={previousPrescription.imageDataUrl}
                      alt={`Previous prescription, version ${baseVersion}`}
                      className="image-modal-img"
                    />
                    <figcaption className="image-modal-caption">
                      Previous · Version {baseVersion} · {formatDateTime(previousPrescription.uploadedAt)}
                    </figcaption>
                  </figure>
                )}
                {(imageView === 'both' || imageView === 'new') && (
                  <figure className="image-figure">
                    <img
                      src={newPrescription.imageDataUrl}
                      alt={`New prescription, version ${newVersion}`}
                      className="image-modal-img"
                    />
                    <figcaption className="image-modal-caption">
                      New · Version {newVersion} · {formatDateTime(newPrescription.uploadedAt)}
                    </figcaption>
                  </figure>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* ── Single medicine card ─────────────────────────────────────── */

function MedicineComparisonCard({
  item,
  onViewPrevious,
  onViewNew,
}: {
  item: ComparedMedicine;
  onViewPrevious: () => void;
  onViewNew: () => void;
}) {
  const meta = CATEGORY_META[item.category];
  const status = reviewStatusFor(item);
  const changedFields = new Set(item.diffs.map((diff: ComparisonFieldDiff) => diff.field));
  const previousName = item.previous?.medicineName ?? null;
  const newName = item.next?.medicineName ?? null;
  const displayName = newName ?? previousName ?? 'Unreadable medicine';

  return (
    <article className={`medicine-compare-card ${meta.className}`} aria-label={`Medicine ${displayName}: ${meta.label}`}>
      <div className="medicine-compare-head">
        <div className="medicine-compare-name">
          <span className={`badge category-badge ${meta.className}`}>
            <span aria-hidden="true">{meta.emoji}</span> {meta.label}
          </span>
          <h3>{displayName}</h3>
          {previousName && newName && previousName !== newName && (
            <p className="name-change-note">
              Previous name: <strong>{previousName}</strong> → New name: <strong>{newName}</strong>
            </p>
          )}
        </div>
        <span className={`review-status ${status.className}`}>{status.label}</span>
      </div>

      {item.reviewReasons.length > 0 && (
        <div className="review-reasons" role="note">
          <AlertTriangle size={16} aria-hidden="true" />
          <ul>
            {item.reviewReasons.map(reason => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="medicine-columns">
        <div className="medicine-column">
          <span className="medicine-column-label">Previous prescription</span>
          {item.previous ? (
            <MedicationValues med={item.previous} changedFields={changedFields} side="previous" />
          ) : (
            <p className="not-present">Not present in this version</p>
          )}
        </div>

        <div className="medicine-column medicine-column--new">
          <span className="medicine-column-label">New prescription</span>
          {item.next ? (
            <MedicationValues med={item.next} changedFields={changedFields} side="new" />
          ) : (
            <p className="not-present">Not listed in this version</p>
          )}
        </div>
      </div>

      {item.diffs.length > 0 && (
        <div className="diff-table-wrap">
          <table className="diff-table">
            <caption>Exact field-level differences</caption>
            <thead>
              <tr>
                <th scope="col">Field</th>
                <th scope="col">Previous</th>
                <th scope="col">New</th>
              </tr>
            </thead>
            <tbody>
              {item.diffs.map(diff => (
                <tr key={diff.field}>
                  <th scope="row">{diff.label}</th>
                  <td>{diff.previousValue ?? <span className="field-missing">Not stated</span>}</td>
                  <td>{diff.newValue ?? <span className="field-missing">Not stated</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="medicine-compare-footer">
        <span className="image-refs-label">
          <FileImage size={15} aria-hidden="true" /> Original image references:
        </span>
        <div className="image-ref-buttons">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onViewPrevious}>
            Previous image
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onViewNew}>
            New image
          </button>
        </div>
        <span className={`review-status review-status--compact ${status.className}`}>
          Review status: {status.label}
        </span>
      </div>
    </article>
  );
}

function MedicationValues({
  med,
  changedFields,
  side,
}: {
  med: MedicationEntry;
  changedFields: Set<string>;
  side: 'previous' | 'new';
}) {
  return (
    <dl className="medicine-values">
      {FIELD_ROWS.map(row => {
        const value = displayField(med, row.key);
        const changed = changedFields.has(String(row.key));
        return (
          <div key={String(row.key)} className={`medicine-value-row ${changed ? 'value-changed' : ''}`}>
            <dt>{row.label}</dt>
            <dd>
              {value ?? <span className="field-missing">Not stated</span>}
              {changed && (
                <span className="changed-tag">{side === 'new' ? 'different' : 'changed'}</span>
              )}
            </dd>
          </div>
        );
      })}
      <div className={`medicine-value-row ${changedFields.has('timings') ? 'value-changed' : ''}`}>
        <dt>Timing</dt>
        <dd>
          {displayField(med, 'timings') ?? <span className="field-missing">Not stated</span>}
          {changedFields.has('timings') && <span className="changed-tag">different</span>}
        </dd>
      </div>
      <div className={`medicine-value-row ${changedFields.has('notes') ? 'value-changed' : ''}`}>
        <dt>Notes</dt>
        <dd>
          {displayField(med, 'notes') ?? <span className="field-missing">Not stated</span>}
          {changedFields.has('notes') && <span className="changed-tag">different</span>}
        </dd>
      </div>
      {med.unclear && (
        <div className="medicine-value-row value-unclear">
          <dt>Extraction</dt>
          <dd>Marked unclear — verify with the original prescription.</dd>
        </div>
      )}
    </dl>
  );
}
