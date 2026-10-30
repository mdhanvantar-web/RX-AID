import type {
  Prescription,
  Patient,
  DoseRecord,
  AppState,
  UserProfile,
  CartItem,
  OrderRecord,
} from '../types';

const STORAGE_KEY = 'rxaid_app_state_v2';

const DEFAULT_PATIENT: Patient = {
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
  language: 'en',
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
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
      selectedPharmacyId: parsed.selectedPharmacyId ?? 'store-local',
      language: parsed.language ?? 'en',
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
