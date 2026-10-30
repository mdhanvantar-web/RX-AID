import type {
  Prescription,
  Patient,
  DoseRecord,
  AppState,
} from '../types';

const STORAGE_KEY = 'rxaid_app_state';

const DEFAULT_PATIENT: Patient = {
  id: 'patient-001',
  name: 'Ramaiah Naidu',
  age: 68,
  relationship: 'Father',
  conditions: ['Type 2 Diabetes', 'Hypertension'],
};

const DEFAULT_STATE: AppState = {
  patient: DEFAULT_PATIENT,
  prescriptions: [],
  doses: [],
  activePrescriptionId: null,
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
      prescriptions: parsed.prescriptions ?? [],
      doses: parsed.doses ?? [],
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
  const doses = state.doses.map(d => d.id === doseId ? { ...d, ...updates } : d);
  const next = { ...state, doses };
  saveState(next);
  return next;
}

export function addDoses(state: AppState, newDoses: DoseRecord[]): AppState {
  // Deduplicate by id
  const existingIds = new Set(state.doses.map(d => d.id));
  const toAdd = newDoses.filter(d => !existingIds.has(d.id));
  const doses = [...state.doses, ...toAdd];
  const next = { ...state, doses };
  saveState(next);
  return next;
}
