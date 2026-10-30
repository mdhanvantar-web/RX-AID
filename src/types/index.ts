// RX-AID Core Type Definitions
export type MedicationTiming = 'morning' | 'afternoon' | 'evening' | 'night';
export type DoseStatus = 'pending' | 'taken' | 'missed' | 'skipped';
export type PrescriptionStatus = 'processing' | 'extracted' | 'verified' | 'active' | 'error';

export interface MedicationEntry {
  id: string;
  medicineName: string;
  strength: string | null;
  dose: string | null;
  frequency: string | null;
  timings: MedicationTiming[];
  foodInstruction: string | null; // e.g., 'before food', 'after food', 'with food'
  duration: string | null;
  notes: string | null;
  unclear: boolean;
  unclearFields: string[];
}

export interface ExtractedPrescription {
  medications: MedicationEntry[];
  patientName: string | null;
  doctorName: string | null;
  prescriptionDate: string | null;
  rawText: string | null;
  extractionWarnings: string[];
  confidence: 'high' | 'medium' | 'low' | 'unclear';
}

export interface Prescription {
  id: string;
  imageDataUrl: string;
  imageFileName: string;
  uploadedAt: string; // ISO date string
  status: PrescriptionStatus;
  extracted: ExtractedPrescription | null;
  verified: ExtractedPrescription | null; // after human review
  errorMessage: string | null;
}

export interface DoseRecord {
  id: string;
  medicationId: string;
  medicineName: string;
  scheduledTime: MedicationTiming;
  scheduledDate: string; // YYYY-MM-DD
  status: DoseStatus;
  takenAt: string | null; // ISO datetime
  notes: string | null;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  relationship: string; // e.g., 'Mother', 'Father'
  conditions: string[]; // e.g., ['Diabetes', 'Hypertension']
}

export interface AppState {
  patient: Patient;
  prescriptions: Prescription[];
  doses: DoseRecord[];
  activePrescriptionId: string | null;
}

export interface GeminiExtractionResult {
  success: boolean;
  data: ExtractedPrescription | null;
  error: string | null;
  demoMode: boolean;
}
