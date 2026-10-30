import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  FileImage,
  History,
  Info,
  ScanLine,
  Scale,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Prescription, PrescriptionStatus } from '../types';
import './PrescriptionHistory.css';

const STATUS_LABEL: Record<PrescriptionStatus, string> = {
  processing: 'Processing',
  extracted: 'Awaiting verification',
  verified: 'Verified',
  active: 'Verified & active',
  error: 'Extraction error',
};

function statusClass(status: PrescriptionStatus): string {
  if (status === 'active' || status === 'verified') return 'badge-success';
  if (status === 'error') return 'badge-danger';
  if (status === 'extracted') return 'badge-warning';
  return 'badge-muted';
}

function formatDateTime(iso: string): string {
  try {
    return format(new Date(iso), 'dd MMM yyyy, h:mm a');
  } catch {
    return iso;
  }
}

export function PrescriptionHistory() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { prescriptions, comparisons } = state;

  const [imagePrescription, setImagePrescription] = useState<Prescription | null>(null);

  const chronological = useMemo(
    () =>
      [...prescriptions].sort(
        (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
      ),
    [prescriptions]
  );

  const newestFirst = useMemo(() => [...chronological].reverse(), [chronological]);

  const versionById = useMemo(() => {
    const map = new Map<string, number>();
    chronological.forEach((rx, index) => map.set(rx.id, index + 1));
    return map;
  }, [chronological]);

  const defaultBase = newestFirst[1]?.id ?? newestFirst[0]?.id ?? '';
  const defaultNew = newestFirst[0]?.id ?? '';
  const [baseId, setBaseId] = useState(defaultBase);
  const [newId, setNewId] = useState(defaultNew);
  const [pairError, setPairError] = useState<string | null>(null);

  const handleCompareSaved = () => {
    if (!baseId || !newId) {
      setPairError('Please choose two saved prescription versions.');
      return;
    }
    if (baseId === newId) {
      setPairError('Please choose two different prescription versions.');
      return;
    }
    const base = prescriptions.find(rx => rx.id === baseId);
    const next = prescriptions.find(rx => rx.id === newId);
    if (!base?.extracted && !base?.verified) {
      setPairError('The earlier version has no extracted medicines to compare.');
      return;
    }
    if (!next?.extracted && !next?.verified) {
      setPairError('The newer version has no extracted medicines to compare.');
      return;
    }
    setPairError(null);
    navigate(`/prescriptions/compare/${newId}/${baseId}`);
  };

  const comparisonsFor = (prescriptionId: string) =>
    comparisons
      .filter(c => c.previousPrescriptionId === prescriptionId || c.newPrescriptionId === prescriptionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const describeComparison = (recordId: string) => {
    const record = comparisons.find(c => c.id === recordId);
    if (!record) return '';
    const { summary } = record.result;
    const parts = [
      `${summary.changed} changed`,
      `${summary.added} added`,
      `${summary.removed} no longer listed`,
    ];
    if (summary.needsReview > 0) parts.push(`${summary.needsReview} need review`);
    return parts.join(' · ');
  };

  return (
    <main className="page-content rx-history-page">
      <div className="container">
        <header className="history-header animate-fade-in">
          <div>
            <p className="section-label">Prescription Change Detector</p>
            <h1>Prescription History</h1>
            <p className="history-subtitle">
              Every scanned prescription is kept as its own version. Open an earlier version or
              compare it with a new scan. Older versions are never overwritten.
            </p>
          </div>

          <button
            id="history-scan-new-btn"
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/scan')}
          >
            <ScanLine size={18} aria-hidden="true" />
            <span>Scan New Prescription</span>
          </button>
        </header>

        <div className="safety-notice animate-fade-in" role="note">
          <ShieldCheck size={20} className="icon" aria-hidden="true" />
          <p>
            <strong>Review notices only.</strong> The comparison tool never changes, stops, or starts
            a medicine. Always confirm prescription changes with the prescribing doctor or a
            qualified healthcare professional before acting.
          </p>
        </div>

        {prescriptions.length === 0 ? (
          <div className="empty-state card animate-fade-in" style={{ marginTop: 'var(--space-6)' }}>
            <div className="empty-icon" aria-hidden="true"><FileImage size={40} /></div>
            <p className="empty-title">No saved prescriptions yet</p>
            <p className="empty-sub">
              Scan your first prescription. It will appear here as Version 1, and future scans can be
              compared against it.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/scan')}>
              <ScanLine size={18} aria-hidden="true" />
              <span>Scan First Prescription</span>
            </button>
          </div>
        ) : (
          <>
            {/* Compare any two saved versions */}
            <section className="compare-picker card animate-fade-in" aria-labelledby="compare-picker-title">
              <div className="compare-picker-head">
                <div>
                  <h2 id="compare-picker-title" className="card-title">
                    <Scale size={20} aria-hidden="true" />
                    Compare Two Saved Versions
                  </h2>
                  <p className="compare-picker-sub">
                    Choose the earlier prescription as the reference, then the newer version.
                  </p>
                </div>
              </div>

              <div className="compare-picker-controls">
                <div className="picker-field">
                  <label htmlFor="base-version-select" className="picker-label">Earlier version (reference)</label>
                  <select
                    id="base-version-select"
                    className="input"
                    value={baseId}
                    onChange={e => setBaseId(e.target.value)}
                  >
                    {newestFirst.map(rx => (
                      <option key={rx.id} value={rx.id}>
                        Version {versionById.get(rx.id)} — {formatDateTime(rx.uploadedAt)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="picker-arrow" aria-hidden="true"><ArrowRight size={22} /></div>

                <div className="picker-field">
                  <label htmlFor="new-version-select" className="picker-label">Newer version</label>
                  <select
                    id="new-version-select"
                    className="input"
                    value={newId}
                    onChange={e => setNewId(e.target.value)}
                  >
                    {newestFirst.map(rx => (
                      <option key={rx.id} value={rx.id}>
                        Version {versionById.get(rx.id)} — {formatDateTime(rx.uploadedAt)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  id="compare-saved-btn"
                  type="button"
                  className="btn btn-primary compare-saved-btn"
                  onClick={handleCompareSaved}
                >
                  <Scale size={18} aria-hidden="true" />
                  <span>Compare</span>
                </button>
              </div>

              {pairError && (
                <p className="picker-error" role="alert">
                  <AlertTriangle size={15} aria-hidden="true" /> {pairError}
                </p>
              )}
            </section>

            <section className="history-section" aria-labelledby="history-list-title">
              <div className="history-section-head">
                <h2 id="history-list-title" className="card-title">
                  <History size={20} aria-hidden="true" />
                  Saved Prescription Versions
                </h2>
                <span className="badge badge-muted">{prescriptions.length} saved</span>
              </div>

              <div className="history-list stagger">
                {newestFirst.map(rx => {
                  const meds = rx.verified?.medications ?? rx.extracted?.medications ?? [];
                  const rxComparisons = comparisonsFor(rx.id);
                  return (
                    <article key={rx.id} className="history-card card" aria-label={`Prescription version ${versionById.get(rx.id)}`}>
                      <div className="history-thumb-col">
                        {rx.imageDataUrl ? (
                          <button
                            type="button"
                            className="history-thumb-btn"
                            onClick={() => setImagePrescription(rx)}
                            aria-label={`View original image for version ${versionById.get(rx.id)}`}
                          >
                            <img src={rx.imageDataUrl} alt="" className="history-thumb-img" />
                            <span className="history-thumb-overlay">View original</span>
                          </button>
                        ) : (
                          <div className="history-thumb-placeholder"><FileImage size={26} aria-hidden="true" /></div>
                        )}
                        <span className="version-chip">Version {versionById.get(rx.id)}</span>
                      </div>

                      <div className="history-card-body">
                        <div className="history-card-top">
                          <div>
                            <h3 className="history-card-title">
                              {rx.verified?.patientName ?? rx.extracted?.patientName ?? rx.imageFileName}
                            </h3>
                            <p className="history-card-file">{rx.imageFileName}</p>
                          </div>
                          <span className={`badge ${statusClass(rx.status)}`}>{STATUS_LABEL[rx.status]}</span>
                        </div>

                        <div className="history-meta-row">
                          <span className="history-meta">
                            <Calendar size={15} aria-hidden="true" />
                            {formatDateTime(rx.uploadedAt)}
                          </span>
                          <span className="history-meta">
                            <Clock size={15} aria-hidden="true" />
                            {meds.length} medicine{meds.length === 1 ? '' : 's'} extracted
                          </span>
                          {rx.errorMessage && (
                            <span className="history-meta history-meta--error">
                              <AlertTriangle size={15} aria-hidden="true" /> Extraction error
                            </span>
                          )}
                        </div>

                        {(rx.verified || rx.extracted) && (
                          <p className="history-med-preview">
                            {meds.slice(0, 4).map(m => m.medicineName).join(' · ')}
                            {meds.length > 4 ? ` · +${meds.length - 4} more` : ''}
                          </p>
                        )}

                        <div className="history-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/verify/${rx.id}`)}
                            disabled={!rx.extracted && !rx.verified}
                          >
                            <FileImage size={16} aria-hidden="true" />
                            Open version
                          </button>

                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate(`/scan?compareWith=${rx.id}`)}
                            disabled={!rx.extracted && !rx.verified}
                          >
                            <ScanLine size={16} aria-hidden="true" />
                            Compare New Prescription
                          </button>
                        </div>

                        {rxComparisons.length > 0 && (
                          <div className="history-comparisons">
                            <span className="history-comparisons-label">Comparison history</span>
                            {rxComparisons.slice(0, 3).map(record => (
                              <button
                                key={record.id}
                                type="button"
                                className="history-comparison-link"
                                onClick={() =>
                                  navigate(
                                    `/prescriptions/compare/${record.newPrescriptionId}/${record.previousPrescriptionId}`
                                  )
                                }
                              >
                                <CheckCircle size={14} aria-hidden="true" />
                                <span>
                                  {format(new Date(record.createdAt), 'dd MMM yyyy, h:mm a')} —{' '}
                                  {describeComparison(record.id)}
                                </span>
                                <span className={`badge ${record.status === 'reviewed' ? 'badge-success' : 'badge-warning'}`}>
                                  {record.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}

        <div className="history-help card animate-fade-in">
          <Info size={18} aria-hidden="true" />
          <p>
            <strong>How versions work:</strong> a new scan always creates a new version. Your older
            prescription images, extraction records, and verification status stay available. A
            version with a detected change stays pending until you verify it.
          </p>
        </div>

        {imagePrescription && (
          <div
            className="image-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-image-title"
            onClick={() => setImagePrescription(null)}
          >
            <div className="image-modal-card card" onClick={e => e.stopPropagation()}>
              <div className="image-modal-head">
                <h2 id="history-image-title">
                  Version {versionById.get(imagePrescription.id)} — original prescription
                </h2>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  onClick={() => setImagePrescription(null)}
                  aria-label="Close original image"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <img
                src={imagePrescription.imageDataUrl}
                alt={`Original prescription image for version ${versionById.get(imagePrescription.id)}`}
                className="image-modal-img"
              />
              <p className="image-modal-caption">
                {formatDateTime(imagePrescription.uploadedAt)} · {imagePrescription.imageFileName}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
