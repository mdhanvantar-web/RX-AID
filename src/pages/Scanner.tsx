import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Camera,
  X,
  AlertTriangle,
  FileImage,
  Loader2,
  CheckCircle,
  Info,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../context/AppContext';
import { extractPrescriptionWithGemini } from '../services/gemini';
import type { Prescription } from '../types';
import './Scanner.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 10;

type ScanState = 'idle' | 'preview' | 'processing' | 'done' | 'error';

export function Scanner() {
  const navigate = useNavigate();
  const { upsertPrescription } = useApp();

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return 'Please upload a JPEG, PNG, or WebP image.';
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `Image must be smaller than ${MAX_SIZE_MB}MB.`;
    return null;
  };

  const loadImage = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMsg(validationError);
      setScanState('error');
      return;
    }

    setErrorMsg(null);
    setImageFileName(file.name);

    const reader = new FileReader();
    reader.onload = e => {
      setImageDataUrl(e.target?.result as string);
      setScanState('preview');
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the image file. Please try again.');
      setScanState('error');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImage(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('drop-zone--dragover');
    const file = e.dataTransfer.files?.[0];
    if (file) loadImage(file);
  }, [loadImage]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dropZoneRef.current?.classList.add('drop-zone--dragover');
  };
  const handleDragLeave = () => {
    dropZoneRef.current?.classList.remove('drop-zone--dragover');
  };

  const handleLoadSample = async () => {
    try {
      const resp = await fetch('/sample_prescription.jpg');
      const blob = await resp.blob();
      const file = new File([blob], 'synthetic_sample_prescription.jpg', { type: 'image/jpeg' });
      loadImage(file);
    } catch {
      setErrorMsg('Failed to load sample prescription image.');
      setScanState('error');
    }
  };

  const handleAnalyse = async () => {
    if (!imageDataUrl) return;
    setScanState('processing');
    setErrorMsg(null);

    const id = uuidv4();

    // Create a pending prescription record immediately
    const pendingRx: Prescription = {
      id,
      imageDataUrl,
      imageFileName,
      uploadedAt: new Date().toISOString(),
      status: 'processing',
      extracted: null,
      verified: null,
      errorMessage: null,
    };
    upsertPrescription(pendingRx);

    const result = await extractPrescriptionWithGemini(imageDataUrl);

    if (result.success && result.data) {
      setIsDemoMode(result.demoMode);
      const updatedRx: Prescription = {
        ...pendingRx,
        status: 'extracted',
        extracted: result.data,
      };
      upsertPrescription(updatedRx);
      setScanState('done');
      // Navigate to verification after brief success display
      setTimeout(() => navigate(`/verify/${id}`), 1200);
    } else {
      const msg = result.error ?? 'AI extraction failed. Please try again.';
      setErrorMsg(msg);
      const errorRx: Prescription = {
        ...pendingRx,
        status: 'error',
        errorMessage: msg,
      };
      upsertPrescription(errorRx);
      setScanState('error');
    }
  };

  const handleReset = () => {
    setScanState('idle');
    setImageDataUrl(null);
    setImageFileName('');
    setErrorMsg(null);
    setIsDemoMode(false);
  };

  return (
    <main className="page-content scanner-page">
      <div className="container">
        <div className="scanner-layout">

          {/* ─── Header ─── */}
          <header className="scanner-header animate-fade-in">
            <div>
              <p className="section-label">Prescription Scanner</p>
              <h1>Upload Prescription</h1>
              <p className="scanner-subtitle">
                Upload a clear photo of the handwritten prescription. Gemini AI will extract the medication details for your review.
              </p>
            </div>
          </header>

          {/* ─── Safety Notice ─── */}
          <div className="safety-notice animate-fade-in" role="note">
            <Info size={18} className="icon" aria-hidden="true" />
            <p>
              AI extraction is an <strong>unverified draft</strong> — always review against the original prescription before creating a medication schedule. Unclear fields must be clarified with your doctor.
            </p>
          </div>

          {/* ─── Upload Zone or Preview ─── */}
          {(scanState === 'idle' || scanState === 'error') && (
            <div className="upload-area animate-fade-in">
              <div
                id="drop-zone"
                ref={dropZoneRef}
                className="drop-zone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Click or drag to upload a prescription image"
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                <div className="drop-zone-icon" aria-hidden="true">
                  <FileImage size={40} />
                </div>
                <p className="drop-zone-title">Drop prescription image here</p>
                <p className="drop-zone-sub">or click to browse files</p>
                <p className="drop-zone-formats">JPEG · PNG · WebP · up to 10MB</p>
                <button
                  id="browse-files-btn"
                  className="btn btn-secondary"
                  onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  aria-label="Browse files to upload"
                  type="button"
                >
                  <Upload size={16} aria-hidden="true" />
                  Browse Files
                </button>
              </div>

              <div className="upload-divider">
                <span>or</span>
              </div>

              <button
                id="camera-capture-btn"
                className="btn btn-secondary btn-lg camera-btn"
                onClick={() => cameraInputRef.current?.click()}
                aria-label="Capture photo with camera"
                type="button"
              >
                <Camera size={20} aria-hidden="true" />
                Take Photo with Camera
              </button>

              <button
                id="sample-prescription-btn"
                className="btn btn-ghost btn-sm"
                onClick={handleLoadSample}
                aria-label="Load synthetic demonstration prescription"
                type="button"
                style={{ marginTop: 'var(--space-2)' }}
              >
                ✨ Try Sample Synthetic Prescription
              </button>

              {/* Hidden inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-upload-input"
                aria-label="Upload prescription image"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="camera-input"
                aria-label="Capture prescription with camera"
              />

              {/* Error display */}
              {errorMsg && (
                <div className="error-banner" role="alert" aria-live="assertive">
                  <AlertTriangle size={16} aria-hidden="true" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* ─── Image Preview ─── */}
          {(scanState === 'preview' || scanState === 'processing' || scanState === 'done') && imageDataUrl && (
            <div className="preview-area animate-fade-in-scale">
              <div className="preview-image-container">
                <img
                  src={imageDataUrl}
                  alt="Uploaded prescription"
                  className="preview-image"
                />
                {scanState === 'processing' && (
                  <div className="processing-overlay" aria-live="polite" aria-busy="true">
                    <div className="processing-spinner">
                      <Loader2 size={32} className="animate-spin" aria-hidden="true" />
                    </div>
                    <p>Analysing with Gemini AI…</p>
                    <p className="processing-sub">Extracting medication details</p>
                  </div>
                )}
                {scanState === 'done' && (
                  <div className="success-overlay" aria-live="polite">
                    <CheckCircle size={40} className="success-icon" aria-hidden="true" />
                    <p>Extraction complete!</p>
                    <p className="processing-sub">Redirecting to verification…</p>
                  </div>
                )}
                {scanState === 'preview' && (
                  <button
                    id="remove-image-btn"
                    className="btn btn-danger btn-icon remove-btn"
                    onClick={handleReset}
                    aria-label="Remove uploaded image"
                    type="button"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Demo mode warning */}
              {isDemoMode && (
                <div className="demo-banner" role="note">
                  <AlertTriangle size={14} aria-hidden="true" />
                  <span>
                    <strong>Demo Mode</strong> — No Gemini API key configured. Showing synthetic prescription data for demonstration.
                  </span>
                </div>
              )}

              {scanState === 'preview' && (
                <div className="preview-actions">
                  <div className="preview-file-info">
                    <FileImage size={14} aria-hidden="true" />
                    <span>{imageFileName}</span>
                  </div>
                  <div className="preview-btns">
                    <button
                      id="change-image-btn"
                      className="btn btn-ghost"
                      onClick={handleReset}
                      type="button"
                      aria-label="Choose a different image"
                    >
                      Change Image
                    </button>
                    <button
                      id="analyse-btn"
                      className="btn btn-primary btn-lg"
                      onClick={handleAnalyse}
                      type="button"
                      aria-label="Analyse prescription with Gemini AI"
                    >
                      Analyse with Gemini AI
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
