import type {
  Prescription,
  Patient,
  DoseRecord,
  AppState,
  UserProfile,
  CartItem,
  OrderRecord,
  PrescriptionComparisonRecord,
} from '../types';

const STORAGE_KEY = 'rxaid_app_state_v2';
const PATIENT_REGISTRY_KEY = 'rxaid_patients_v1';
let currentPatientId: string | null = null;

export function getCurrentPatientId() {
  return currentPatientId;
}

export function setCurrentPatientId(id: string | null) {
  currentPatientId = id;
}

function stateStorageKey() {
  return currentPatientId ? `${STORAGE_KEY}_${currentPatientId}` : STORAGE_KEY;
}

export function loadPatientRegistry(): { patients: Patient[]; activePatientId: string } | null {
  try {
    const raw = localStorage.getItem(PATIENT_REGISTRY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.patients)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePatientRegistry(registry: { patients: Patient[]; activePatientId: string }) {
  try {
    localStorage.setItem(PATIENT_REGISTRY_KEY, JSON.stringify(registry));
  } catch {
    console.error('[RX-AID] Failed to persist patient registry');
  }
}

export const DEFAULT_PATIENT: Patient = {
  id: 'patient-001',
  name: 'Ramaiah Naidu',
  age: 68,
  relationship: 'Father',
  conditions: ['Type 2 Diabetes', 'Hypertension'],
  doctorName: 'Dr. Suresh Kumar, MD',
  doctorPhone: '+91 98480 12345',
};

const DEFAULT_USER: UserProfile = {
  id: 'user-caregiver-01',
  name: 'Monish (Family Caregiver)',
  email: 'monish.care@example.com',
  phone: '+91 90000 00000',
  deliveryAddress: 'Flat 302, Shanti Nilayam, Green Hills Road',
  city: 'Hyderabad',
  pincode: '500033',
  isAuthenticated: true,
  isDemo: true,
};

const DEFAULT_STATE: AppState = {
  patient: DEFAULT_PATIENT,
  user: DEFAULT_USER,
  prescriptions: [],
  doses: [],
  activePrescriptionId: null,
  selectedPharmacyId: 'store-local',
  cart: [],
  orders: [],
  comparisons: [],
  language: 'en',
};

export function loadState(): AppState {
  try {
    const registry = loadPatientRegistry();
    if (registry) {
      setCurrentPatientId(registry.activePatientId);
    } else {
      setCurrentPatientId(null);
    }
    const raw = localStorage.getItem(stateStorageKey());
    if (!raw) {
      if (registry) {
        const active = registry.patients.find((p: Patient) => p.id === registry.activePatientId) || registry.patients[0] || DEFAULT_PATIENT;
        return { ...DEFAULT_STATE, patient: active };
      }
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      patient: parsed.patient ?? DEFAULT_PATIENT,
      user: parsed.user ?? DEFAULT_USER,
      prescriptions: parsed.prescriptions ?? [],
      doses: parsed.doses ?? [],
      cart: parsed.cart ?? [],
      orders: parsed.orders ?? [],
      comparisons: parsed.comparisons ?? [],
      selectedPharmacyId: parsed.selectedPharmacyId ?? 'store-local',
      language: parsed.language ?? 'en',
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(stateStorageKey(), JSON.stringify(state));
  } catch {
    console.error('[RX-AID] Failed to persist state to localStorage');
  }
}

export function savePrescription(state: AppState, prescription: Prescription): AppState {
  const existing = state.prescriptions.findIndex(p => p.id === prescription.id);
  let prescriptions: Prescription[];
  if (existing >= 0) {
    prescriptions = [...state.prescriptions];
    prescriptions[existing] = prescription;
  } else {
    prescriptions = [prescription, ...state.prescriptions];
  }
  const next = { ...state, prescriptions };
  saveState(next);
  return next;
}

export function updateDose(state: AppState, doseId: string, updates: Partial<DoseRecord>): AppState {
  const doses = state.doses.map(d => (d.id === doseId ? { ...d, ...updates } : d));
  const next = { ...state, doses };
  saveState(next);
  return next;
}

export function addDoses(state: AppState, newDoses: DoseRecord[]): AppState {
  const existingIds = new Set(state.doses.map(d => d.id));
  const toAdd = newDoses.filter(d => !existingIds.has(d.id));
  const doses = [...state.doses, ...toAdd];
  const next = { ...state, doses };
  saveState(next);
  return next;
}

export function addToCart(state: AppState, item: CartItem): AppState {
  const existingIndex = state.cart.findIndex(i => i.product.id === item.product.id);
  let cart: CartItem[];
  if (existingIndex >= 0) {
    cart = [...state.cart];
    cart[existingIndex] = {
      ...cart[existingIndex],
      quantity: cart[existingIndex].quantity + item.quantity,
    };
  } else {
    cart = [...state.cart, item];
  }
  const next = { ...state, cart };
  saveState(next);
  return next;
}

export function updateCartQuantity(state: AppState, itemId: string, delta: number): AppState {
  let cart = state.cart.map(item => {
    if (item.id === itemId) {
      const newQty = item.quantity + delta;
      return newQty > 0 ? { ...item, quantity: newQty } : null;
    }
    return item;
  }).filter(Boolean) as CartItem[];

  const next = { ...state, cart };
  saveState(next);
  return next;
}

export function removeFromCart(state: AppState, itemId: string): AppState {
  const cart = state.cart.filter(i => i.id !== itemId);
  const next = { ...state, cart };
  saveState(next);
  return next;
}

export function clearCart(state: AppState): AppState {
  const next = { ...state, cart: [] };
  saveState(next);
  return next;
}

export function addOrder(state: AppState, order: OrderRecord): AppState {
  const orders = [order, ...state.orders];
  const next = { ...state, orders, cart: [] }; // clear cart on order placed
  saveState(next);
  return next;
}

export function saveComparison(
  state: AppState,
  comparison: PrescriptionComparisonRecord
): AppState {
  const existing = state.comparisons.findIndex(c => c.id === comparison.id);
  let comparisons: PrescriptionComparisonRecord[];
  if (existing >= 0) {
    comparisons = [...state.comparisons];
    comparisons[existing] = comparison;
  } else {
    comparisons = [comparison, ...state.comparisons];
  }
  const next = { ...state, comparisons };
  saveState(next);
  return next;
}

export function markComparisonReviewed(state: AppState, comparisonId: string): AppState {
  const comparisons = state.comparisons.map(c =>
    c.id === comparisonId ? { ...c, status: 'reviewed' as const } : c
  );
  const next = { ...state, comparisons };
  saveState(next);
  return next;
}
