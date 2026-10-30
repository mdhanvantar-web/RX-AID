// RX-AID Core Type Definitions
export type MedicationTiming = 'morning' | 'afternoon' | 'evening' | 'night';
export type DoseStatus = 'pending' | 'taken' | 'missed' | 'skipped';
export type PrescriptionStatus = 'processing' | 'extracted' | 'verified' | 'active' | 'error';
export type AppLanguage = 'en' | 'te';

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
  relationship: string; // e.g., 'Father', 'Mother'
  conditions: string[]; // e.g., ['Type 2 Diabetes', 'Hypertension']
  doctorName?: string;
  doctorPhone?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  city: string;
  pincode: string;
  isAuthenticated: boolean;
  isDemo: boolean;
}

export interface PharmacyStore {
  id: string;
  name: string;
  tagline: string;
  rating: number;
  reviewCount: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  estDeliveryTime: string;
  isHomeDeliveryAvailable: boolean;
  address: string;
  phone: string;
  badge?: string;
}

export interface PharmacyProduct {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  medicineName: string;
  strength: string;
  dosageForm: string; // e.g., 'Tablet', 'Capsule', 'Syrup'
  packInfo: string;   // e.g., 'Strip of 10 tablets'
  price: number;      // in INR (₹)
  deliveryFee: number;
  totalPayable: number;
  inStock: boolean;
  prescriptionRequired: boolean;
  manufacturer?: string;
}

export interface CartItem {
  id: string;
  product: PharmacyProduct;
  quantity: number;
  prescriptionId?: string;
}

export interface OrderRecord {
  id: string;
  date: string;
  items: CartItem[];
  pharmacy: PharmacyStore;
  deliveryType: 'delivery' | 'pickup';
  deliveryAddress: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'Order Placed' | 'Being Packed' | 'Out for Delivery' | 'Delivered';
  estimatedArrival: string;
}

export interface AppState {
  patient: Patient;
  user: UserProfile;
  prescriptions: Prescription[];
  doses: DoseRecord[];
  activePrescriptionId: string | null;
  selectedPharmacyId: string;
  cart: CartItem[];
  orders: OrderRecord[];
  language: AppLanguage;
}

export interface GeminiExtractionResult {
  success: boolean;
  data: ExtractedPrescription | null;
  error: string | null;
  demoMode: boolean;
}
