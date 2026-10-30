import type { MedicationEntry, DoseRecord, MedicationTiming } from '../types';
import { format } from 'date-fns';

export function generateDosesForMedication(
  medication: MedicationEntry,
  prescriptionId: string,
  daysAhead = 7,
): DoseRecord[] {
  const doses: DoseRecord[] = [];
  const today = new Date();

  for (let day = 0; day < daysAhead; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);
    const dateStr = format(date, 'yyyy-MM-dd');

    for (const timing of medication.timings) {
      const id = `dose-${prescriptionId}-${medication.id}-${dateStr}-${timing}`;
      doses.push({
        id,
        medicationId: medication.id,
        medicineName: medication.medicineName,
        scheduledTime: timing,
        scheduledDate: dateStr,
        status: 'pending',
        takenAt: null,
        notes: null,
      });
    }
  }

  return doses;
}

export function getTodayDoses(doses: DoseRecord[]): DoseRecord[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  return doses.filter(d => d.scheduledDate === today);
}

export function getTimingLabel(timing: MedicationTiming): string {
  const labels: Record<MedicationTiming, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    night: 'Night',
  };
  return labels[timing];
}

export function getTimingTime(timing: MedicationTiming): string {
  const times: Record<MedicationTiming, string> = {
    morning: '7:00 AM',
    afternoon: '1:00 PM',
    evening: '6:00 PM',
    night: '10:00 PM',
  };
  return times[timing];
}

export function getAdherenceRate(doses: DoseRecord[]): number {
  const past = doses.filter(d => d.scheduledDate < format(new Date(), 'yyyy-MM-dd'));
  if (past.length === 0) return 100;
  const taken = past.filter(d => d.status === 'taken').length;
  return Math.round((taken / past.length) * 100);
}

export function formatPrescriptionDate(isoString: string): string {
  try {
    return format(new Date(isoString), 'dd MMM yyyy');
  } catch {
    return isoString;
  }
}
