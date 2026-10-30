import { useState, useRef, useCallback, useEffect } from 'react';
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
  RefreshCw,
  SwitchCamera,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../context/AppContext';
import { extractPrescriptionWithGemini } from '../services/gemini';
import type { Prescription } from '../types';
import './Scanner.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 10;

type ScanState = 'idle' | 'live-camera' | 'captured-review' | 'preview' | 'processing' | 'done' | 'error';

export function Scanner() {
  const navigate = useNavigate();
  const { upsertPrescription } = useApp();

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Live Camera state
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // ─── Camera Teardown / Cleanup ──────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraStarting(false);
  }, []);

  // Ensure camera streams are always stopped on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // ─── Start Live Camera ──────────────────────────────────────────────────────
  const startLiveCamera = async (facing: 'environment' | 'user' = cameraFacingMode) => {
    setErrorMsg(null);
    stopCamera();

    // Browser support & secure context check
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg(
        'Live camera access is not supported by your current browser. Please upload from your phone gallery or files.'
      );
      setScanState('idle');
      return;
    }

    if (window.isSecureContext === false && location.hostname !== 'localhost') {
      setErrorMsg(
        'Camera access requires a secure connection (HTTPS). Please upload from files or open on a secure host.'
      );
      setScanState('idle');
      return;
    }

    setIsCameraStarting(true);
    setScanState('live-camera');

    // Check for front/rear devices
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setHasMultipleCameras(videoInputs.length > 1);
    } catch {
      // Ignore enumeration failure
    }

    const idealConstraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1920, max: 2560 },
        height: { ideal: 1080, max: 1440 },
      },
      audio: false,
    };

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(idealConstraints);
      } catch {
        // Fallback constraint if overconstrained
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraStarting(false);
    } catch (err: unknown) {
      stopCamera();
      const error = err as { name?: string; message?: string };
      console.warn('[RX-AID] Camera error:', error.name, error.message);

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setErrorMsg(
          'Camera permission was denied. Please enable camera access in your browser permissions or choose an image from your gallery.'
        );
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setErrorMsg(
          'No camera hardware detected on this device. You can choose a prescription from your files.'
        );
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setErrorMsg(
          'Camera is already in use by another application. Please close other apps and try again.'
        );
      } else {
        setErrorMsg(
          'Unable to initialize camera. Please try again or use the gallery file upload option.'
        );
      }
      setScanState('idle');
    }
  };

  // Switch between front and rear cameras
  const toggleCameraFacing = () => {
    const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextMode);
    startLiveCamera(nextMode);
  };

  // ─── Capture Photo from Live Frame ──────────────────────────────────────────
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !canvasRef.current) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    const capturedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setImageDataUrl(capturedDataUrl);
    setImageFileName(`prescription_camera_${new Date().toISOString().slice(0, 10)}.jpg`);

    // Turn off live camera immediately after capture to release hardware
    stopCamera();
    setScanState('captured-review');
  };

  const handleRetake = () => {
    setImageDataUrl(null);
    startLiveCamera(cameraFacingMode);
  };

  const handleCancelCamera = () => {
    stopCamera();
    setScanState('idle');
  };

  // ─── File Validation & Loading ──────────────────────────────────────────────
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

  // ─── Gemini Extraction ─────────────────────────────────────────────────────
  const handleAnalyse = async () => {
    if (!imageDataUrl) return;
    setScanState('processing');
    setErrorMsg(null);

    const id = uuidv4();

    // Create a pending prescription record immediately
    const pendingRx: Prescription = {
      id,
      imageDataUrl,
      imageFileName: imageFileName || 'Prescription_Photo.jpg',
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
    stopCamera();
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
              <p className="section-label">Medical Slip Scanner</p>
              <h1>Scan Doctor's Prescription 📷</h1>
              <p className="scanner-subtitle">
                Use your device camera or choose a picture from your gallery. Our friendly Gemini AI will organize the medicines into safe schedules.
              </p>
            </div>
          </header>

          {/* ─── Safety & Privacy Notice ─── */}
          <div className="safety-notice animate-fade-in" role="note">
            <ShieldCheck size={20} className="icon" aria-hidden="true" />
            <p>
              <strong>Camera Privacy Protected:</strong> Camera is only accessed upon your direct tap. Camera tracks turn off immediately after photo capture. Prescription data remains private.
            </p>
          </div>

          {/* ─── Error Banner ─── */}
          {errorMsg && (
            <div className="error-banner animate-fade-in" role="alert" aria-live="assertive">
              <AlertTriangle size={18} aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ─── 1. LIVE CAMERA MODE ─── */}
          {scanState === 'live-camera' && (
            <section className="live-camera-card card animate-fade-in" aria-label="Live camera viewfinder">
              <div className="camera-viewfinder-wrap">
                {isCameraStarting && (
                  <div className="camera-loading-overlay">
                    <Loader2 size={36} className="animate-spin" aria-hidden="true" />
                    <span>Connecting to camera...</span>
                  </div>
                )}
                
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="camera-video-stream"
                  aria-label="Live camera stream"
                />

                {/* Prescription alignment box overlay */}
                <div className="prescription-guide-box" aria-hidden="true">
                  <div className="guide-corner top-left" />
                  <div className="guide-corner top-right" />
                  <div className="guide-corner bottom-left" />
                  <div className="guide-corner bottom-right" />
                  <span className="guide-text">Align prescription paper inside box</span>
                </div>
              </div>

              {/* Accessible Large Capture Controls */}
              <div className="camera-controls-bar">
                <button
                  id="cancel-camera-btn"
                  type="button"
                  className="btn btn-secondary btn-lg"
                  onClick={handleCancelCamera}
                  aria-label="Cancel camera and go back"
                >
                  <X size={20} aria-hidden="true" />
                  <span>Cancel</span>
                </button>

                <button
                  id="capture-photo-btn"
                  type="button"
                  className="btn btn-primary btn-lg capture-shutter-btn"
                  onClick={capturePhoto}
                  disabled={isCameraStarting}
                  aria-label="Capture prescription photo"
                >
                  <Camera size={26} aria-hidden="true" />
                  <span>Capture Photo</span>
                </button>

                {hasMultipleCameras && (
                  <button
                    id="switch-camera-btn"
                    type="button"
                    className="btn btn-secondary btn-lg"
                    onClick={toggleCameraFacing}
                    title="Switch between front and rear camera"
                    aria-label="Switch camera"
                  >
                    <SwitchCamera size={20} aria-hidden="true" />
                    <span>Switch</span>
                  </button>
                )}
              </div>
            </section>
          )}

          {/* ─── 2. CAPTURED / GALLERY PREVIEW REVIEW MODE ─── */}
          {(scanState === 'captured-review' || scanState === 'preview' || scanState === 'processing' || scanState === 'done') && imageDataUrl && (
            <div className="preview-area animate-fade-in">
              <div className="preview-image-container">
                <img
                  src={imageDataUrl}
                  alt="Prescription preview"
                  className="preview-image"
                />

                {scanState === 'processing' && (
                  <div className="processing-overlay" aria-live="polite" aria-busy="true">
                    <Loader2 size={40} className="animate-spin processing-spinner" aria-hidden="true" />
                    <p>Reading Prescription with Gemini AI…</p>
                    <p className="processing-sub">Transcribing medicine names, dosages, and doctor timings</p>
                  </div>
                )}

                {scanState === 'done' && (
                  <div className="success-overlay" aria-live="polite">
                    <CheckCircle size={48} className="success-icon" aria-hidden="true" />
                    <p>Prescription Read Successfully!</p>
                    <p className="processing-sub">Opening verification screen…</p>
                  </div>
                )}

                {(scanState === 'preview' || scanState === 'captured-review') && (
                  <button
                    id="remove-image-btn"
                    className="btn btn-danger btn-icon remove-btn"
                    onClick={handleReset}
                    aria-label="Cancel and choose another image"
                    type="button"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                )}
              </div>

              {isDemoMode && (
                <div className="demo-banner" role="note">
                  <Info size={16} aria-hidden="true" />
                  <span>
                    <strong>Demo Mode:</strong> No Gemini API key provided. Using synthetic prescription data for caregiver preview.
                  </span>
                </div>
              )}

              {(scanState === 'preview' || scanState === 'captured-review') && (
                <div className="review-action-card card">
                  <div className="review-file-meta">
                    <Check size={18} style={{ color: 'var(--color-success)' }} aria-hidden="true" />
                    <span>Photo captured: <strong>{imageFileName}</strong></span>
                  </div>

                  <div className="review-btns-group">
                    <button
                      id="retake-photo-btn"
                      type="button"
                      className="btn btn-secondary btn-lg"
                      onClick={handleRetake}
                      aria-label="Retake photo with camera"
                    >
                      <RefreshCw size={18} aria-hidden="true" />
                      <span>Retake Photo</span>
                    </button>

                    <button
                      id="confirm-analyse-btn"
                      type="button"
                      className="btn btn-primary btn-lg"
                      onClick={handleAnalyse}
                      aria-label="Confirm prescription photo and read with AI"
                    >
                      <CheckCircle size={20} aria-hidden="true" />
                      <span>Confirm & Read with Gemini AI</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── 3. IDLE / INITIAL SCANNER SELECTION ─── */}
          {(scanState === 'idle' || scanState === 'error') && (
            <div className="scanner-choice-layout animate-fade-in">
              
              {/* Primary Live Camera Action */}
              <div className="camera-prompt-card card">
                <div className="prompt-icon-box" aria-hidden="true">
                  <Camera size={38} />
                </div>
                <h2>Take Photo with Device Camera</h2>
                <p>
                  Opens your live rear camera with an alignment guide to take a crisp photo of the paper prescription.
                </p>

                <div className="camera-action-group">
                  <button
                    id="open-live-camera-btn"
                    type="button"
                    className="btn btn-primary btn-lg open-camera-main-btn"
                    onClick={() => startLiveCamera('environment')}
                    aria-label="Open live camera"
                  >
                    <Camera size={22} aria-hidden="true" />
                    <span>Open Live Camera</span>
                  </button>

                  <button
                    id="mobile-native-camera-btn"
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    aria-label="Open native camera app"
                    title="Opens native camera app on Android or iOS"
                  >
                    <span>Use Native Camera App</span>
                  </button>
                </div>
              </div>

              {/* Secondary: Gallery / File Upload */}
              <div className="gallery-section">
                <div className="upload-divider">
                  <span>or choose from gallery</span>
                </div>

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
                  aria-label="Upload prescription image from phone gallery or files"
                  onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                >
                  <FileImage size={36} className="drop-zone-icon" aria-hidden="true" />
                  <p className="drop-zone-title">Upload from Gallery / Files</p>
                  <p className="drop-zone-sub">Tap here to select an image from your computer or phone gallery</p>
                  <p className="drop-zone-formats">Supports JPEG · PNG · WebP (up to 10MB)</p>
                  <button
                    id="browse-files-btn"
                    type="button"
                    className="btn btn-secondary"
                    onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    <Upload size={16} aria-hidden="true" />
                    <span>Browse Gallery</span>
                  </button>
                </div>

                <button
                  id="sample-prescription-btn"
                  type="button"
                  className="btn btn-ghost sample-btn-friendly"
                  onClick={handleLoadSample}
                  aria-label="Try sample synthetic prescription"
                >
                  ✨ Try Sample Synthetic Prescription (Demo)
                </button>
              </div>

            </div>
          )}

          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} style={{ display: 'none' }} aria-hidden="true" />

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="file-upload-input"
            aria-label="Upload prescription image from gallery"
          />

          <input
            ref={nativeCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="native-camera-input"
            aria-label="Capture with mobile native camera"
          />

        </div>
      </div>
    </main>
  );
}
