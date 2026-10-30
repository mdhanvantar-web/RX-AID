import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { AppState, Prescription, DoseRecord, DoseStatus } from '../types';
import {
  loadState,
  saveState,
  savePrescription as persistPrescription,
  updateDose as persistDose,
  addDoses as persistDoses,
} from '../services/storage';

// ─── Actions ───────────────────────────────────────────────────────────────
type Action =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'UPSERT_PRESCRIPTION'; payload: Prescription }
  | { type: 'SET_ACTIVE_PRESCRIPTION'; payload: string | null }
  | { type: 'UPDATE_DOSE'; payload: { doseId: string; updates: Partial<DoseRecord> } }
  | { type: 'ADD_DOSES'; payload: DoseRecord[] };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;

    case 'UPSERT_PRESCRIPTION': {
      const next = persistPrescription(state, action.payload);
      return next;
    }

    case 'SET_ACTIVE_PRESCRIPTION': {
      const next = { ...state, activePrescriptionId: action.payload };
      saveState(next);
      return next;
    }

    case 'UPDATE_DOSE': {
      const next = persistDose(state, action.payload.doseId, action.payload.updates);
      return next;
    }

    case 'ADD_DOSES': {
      const next = persistDoses(state, action.payload);
      return next;
    }

    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  upsertPrescription: (p: Prescription) => void;
  setActivePrescription: (id: string | null) => void;
  markDose: (doseId: string, status: DoseStatus) => void;
  addDoses: (doses: DoseRecord[]) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

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

  return (
    <AppContext.Provider value={{ state, upsertPrescription, setActivePrescription, markDose, addDoses }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
