import React, { createContext, useContext, useReducer, useCallback, useState } from 'react';
import type {
  AppState,
  Prescription,
  DoseRecord,
  DoseStatus,
  PharmacyProduct,
  CartItem,
  OrderRecord,
  AppLanguage,
  UserProfile,
  PrescriptionComparisonRecord,
  Patient,
} from '../types';
import {
  loadState,
  saveState,
  savePrescription as persistPrescription,
  updateDose as persistDose,
  addDoses as persistDoses,
  addToCart as persistAddToCart,
  updateCartQuantity as persistUpdateCartQty,
  removeFromCart as persistRemoveFromCart,
  clearCart as persistClearCart,
  addOrder as persistAddOrder,
  saveComparison as persistComparison,
  markComparisonReviewed as persistComparisonReviewed,
  loadPatientRegistry,
  savePatientRegistry,
  setCurrentPatientId,
  DEFAULT_PATIENT,
} from '../services/storage';

// ─── Actions ────────────────────────────────────────────────────────────────
type Action =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'UPSERT_PRESCRIPTION'; payload: Prescription }
  | { type: 'SET_ACTIVE_PRESCRIPTION'; payload: string | null }
  | { type: 'UPDATE_DOSE'; payload: { doseId: string; updates: Partial<DoseRecord> } }
  | { type: 'ADD_DOSES'; payload: DoseRecord[] }
  | { type: 'SET_PHARMACY'; payload: string }
  | { type: 'ADD_TO_CART'; payload: { product: PharmacyProduct; quantity: number; prescriptionId?: string } }
  | { type: 'UPDATE_CART_QTY'; payload: { itemId: string; delta: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'ADD_ORDER'; payload: OrderRecord }
  | { type: 'UPSERT_COMPARISON'; payload: PrescriptionComparisonRecord }
  | { type: 'MARK_COMPARISON_REVIEWED'; payload: string }
  | { type: 'SET_LANGUAGE'; payload: AppLanguage }
  | { type: 'UPDATE_USER'; payload: Partial<UserProfile> }
  | { type: 'LOGOUT' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;

    case 'UPSERT_PRESCRIPTION':
      return persistPrescription(state, action.payload);

    case 'SET_ACTIVE_PRESCRIPTION': {
      const next = { ...state, activePrescriptionId: action.payload };
      saveState(next);
      return next;
    }

    case 'UPDATE_DOSE':
      return persistDose(state, action.payload.doseId, action.payload.updates);

    case 'ADD_DOSES':
      return persistDoses(state, action.payload);

    case 'SET_PHARMACY': {
      const next = { ...state, selectedPharmacyId: action.payload };
      saveState(next);
      return next;
    }

    case 'ADD_TO_CART': {
      const { product, quantity, prescriptionId } = action.payload;
      const cartItem: CartItem = {
        id: `cart-${product.id}-${Date.now()}`,
        product,
        quantity,
        prescriptionId,
      };
      return persistAddToCart(state, cartItem);
    }

    case 'UPDATE_CART_QTY':
      return persistUpdateCartQty(state, action.payload.itemId, action.payload.delta);

    case 'REMOVE_FROM_CART':
      return persistRemoveFromCart(state, action.payload);

    case 'CLEAR_CART':
      return persistClearCart(state);

    case 'ADD_ORDER':
      return persistAddOrder(state, action.payload);

    case 'UPSERT_COMPARISON':
      return persistComparison(state, action.payload);

    case 'MARK_COMPARISON_REVIEWED':
      return persistComparisonReviewed(state, action.payload);

    case 'SET_LANGUAGE': {
      const next = { ...state, language: action.payload };
      saveState(next);
      return next;
    }

    case 'UPDATE_USER': {
      const next = { ...state, user: { ...state.user, ...action.payload } };
      saveState(next);
      return next;
    }

    case 'LOGOUT': {
      const next = {
        ...state,
        user: { ...state.user, isAuthenticated: false },
      };
      saveState(next);
      return next;
    }

    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  patients: Patient[];
  activePatientId: string;
  switchPatient: (id: string) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (patient: Patient) => void;
  removePatient: (id: string) => void;
  upsertPrescription: (p: Prescription) => void;
  setActivePrescription: (id: string | null) => void;
  markDose: (doseId: string, status: DoseStatus) => void;
  addDoses: (doses: DoseRecord[]) => void;
  setSelectedPharmacy: (pharmacyId: string) => void;
  addToCart: (product: PharmacyProduct, quantity?: number, prescriptionId?: string) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  createOrder: (order: OrderRecord) => void;
  saveComparison: (comparison: PrescriptionComparisonRecord) => void;
  markComparisonReviewed: (comparisonId: string) => void;
  setLanguage: (lang: AppLanguage) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  logout: () => void;
  cartCount: number;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  const initialRegistry = loadPatientRegistry();
  const [patients, setPatients] = useState<Patient[]>(
    initialRegistry?.patients ?? [state.patient ?? DEFAULT_PATIENT]
  );
  const [activePatientId, setActivePatientId] = useState<string>(
    initialRegistry?.activePatientId ?? (state.patient?.id ?? DEFAULT_PATIENT.id)
  );

  const upsertPrescription = useCallback((p: Prescription) => {
    dispatch({ type: 'UPSERT_PRESCRIPTION', payload: p });
  }, []);

  const setActivePrescription = useCallback((id: string | null) => {
    dispatch({ type: 'SET_ACTIVE_PRESCRIPTION', payload: id });
  }, []);

  const markDose = useCallback((doseId: string, status: DoseStatus) => {
    dispatch({
      type: 'UPDATE_DOSE',
      payload: {
        doseId,
        updates: {
          status,
          takenAt: status === 'taken' ? new Date().toISOString() : null,
        },
      },
    });
  }, []);

  const addDoses = useCallback((doses: DoseRecord[]) => {
    dispatch({ type: 'ADD_DOSES', payload: doses });
  }, []);

  const setSelectedPharmacy = useCallback((pharmacyId: string) => {
    dispatch({ type: 'SET_PHARMACY', payload: pharmacyId });
  }, []);

  const addToCart = useCallback((product: PharmacyProduct, quantity = 1, prescriptionId?: string) => {
    dispatch({ type: 'ADD_TO_CART', payload: { product, quantity, prescriptionId } });
  }, []);

  const updateCartQuantity = useCallback((itemId: string, delta: number) => {
    dispatch({ type: 'UPDATE_CART_QTY', payload: { itemId, delta } });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const createOrder = useCallback((order: OrderRecord) => {
    dispatch({ type: 'ADD_ORDER', payload: order });
  }, []);

  const saveComparison = useCallback((comparison: PrescriptionComparisonRecord) => {
    dispatch({ type: 'UPSERT_COMPARISON', payload: comparison });
  }, []);

  const markComparisonReviewed = useCallback((comparisonId: string) => {
    dispatch({ type: 'MARK_COMPARISON_REVIEWED', payload: comparisonId });
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
  }, []);

  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  const switchPatient = useCallback((id: string) => {
    const target = patients.find(p => p.id === id);
    if (!target) return;
    saveState(state);
    setCurrentPatientId(id);
    const loaded = loadState();
    const next = { ...loaded, patient: target };
    dispatch({ type: 'SET_STATE', payload: next });
    setActivePatientId(id);
  }, [patients, state]);

  const addPatient = useCallback((patient: Patient) => {
    const registry = loadPatientRegistry() || { patients: [...patients], activePatientId };
    const updatedPatients = [...registry.patients, patient];
    const updatedRegistry = { patients: updatedPatients, activePatientId: patient.id };
    savePatientRegistry(updatedRegistry);
    setPatients(updatedPatients);
    saveState(state);
    setCurrentPatientId(patient.id);
    const loaded = loadState();
    const next = { ...loaded, patient };
    dispatch({ type: 'SET_STATE', payload: next });
    setActivePatientId(patient.id);
  }, [patients, activePatientId, state]);

  const updatePatient = useCallback((patient: Patient) => {
    const registry = loadPatientRegistry();
    if (registry) {
      const updatedPatients = registry.patients.map(p => (p.id === patient.id ? patient : p));
      savePatientRegistry({ ...registry, patients: updatedPatients });
      setPatients(updatedPatients);
    }
    if (patient.id === activePatientId) {
      const next = { ...state, patient };
      dispatch({ type: 'SET_STATE', payload: next });
      saveState(next);
    }
  }, [activePatientId, state]);

  const removePatient = useCallback((id: string) => {
    const registry = loadPatientRegistry();
    if (!registry || registry.patients.length <= 1) return;
    const updatedPatients = registry.patients.filter(p => p.id !== id);
    const newActive = id === registry.activePatientId ? updatedPatients[0].id : registry.activePatientId;
    savePatientRegistry({ patients: updatedPatients, activePatientId: newActive });
    setPatients(updatedPatients);
    if (id === activePatientId) {
      switchPatient(newActive);
    }
  }, [activePatientId, switchPatient]);

  const cartCount = state.cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        state,
        patients,
        activePatientId,
        switchPatient,
        addPatient,
        updatePatient,
        removePatient,
        upsertPrescription,
        setActivePrescription,
        markDose,
        addDoses,
        setSelectedPharmacy,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        createOrder,
        saveComparison,
        markComparisonReviewed,
        setLanguage,
        updateUser,
        logout,
        cartCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
