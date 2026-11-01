import type {
  ExtractedPrescription,
  MedicationEntry,
  MedicationTiming,
} from '../types';

export type ExtractionSource = 'gemini' | 'demo' | 'manual';

const TIMING_ORDER: MedicationTiming[] = ['morning', 'afternoon', 'evening', 'night'];
const CONFIDENCE_LEVELS = ['high', 'medium', 'low', 'unclear'] as const;
const KNOWN_FIELDS = new Set([
  'medicineName',
  'strength',
  'dose',
  'frequency',
  'timings',
  'foodInstruction',
  'duration',
  'route',
  'notes',
]);

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asText(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function asTimings(value: unknown): MedicationTiming[] {
  if (!Array.isArray(value)) return [];
  const found = new Set<MedicationTiming>();
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const timing = item.trim().toLowerCase();
    if ((TIMING_ORDER as string[]).includes(timing)) {
      found.add(timing as MedicationTiming);
    }
  }
  return TIMING_ORDER.filter(timing => found.has(timing));
}

function asFields(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const fields = new Set<string>();
  for (const item of value) {
    const field = asText(item);
    if (field && KNOWN_FIELDS.has(field)) fields.add(field);
  }
  return [...fields];
}

function asWarnings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => asText(item))
    .filter((item): item is string => Boolean(item));
}

function asDate(value: unknown): string | null {
  const text = asText(value);
  if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const parsed = new Date(`${text}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : text;
}

function asConfidence(value: unknown): ExtractedPrescription['confidence'] {
  const text = asText(value)?.toLowerCase();
  return (CONFIDENCE_LEVELS as readonly string[]).includes(text ?? '')
    ? (text as ExtractedPrescription['confidence'])
    : 'medium';
}

/**
 * Convert whatever the vision model returned into the exact shape the rest of
 * the app relies on. Missing or malformed fields are nulled rather than guessed,
 * and every medicine is marked unclear when the reader flagged it.
 */
export function normalizeExtraction(
  raw: unknown,
  source: ExtractionSource
): ExtractedPrescription {
  const outer = asRecord(raw);
  const root =
    Array.isArray(outer.medications) ? outer : asRecord(outer.prescription);
  const rawMedications = Array.isArray(root.medications)
    ? root.medications
    : Array.isArray(outer.medications)
      ? outer.medications
      : [];

  if (rawMedications.length === 0) {
    throw new Error(
      'No medicines could be read from this image. Try again with a sharper, well-lit photo.'
    );
  }

  const medications: MedicationEntry[] = rawMedications.map((item, index) => {
    const med = asRecord(item);
    const rawName = asText(med.medicineName) ?? asText(med.name);
    const nameUnreadable = !rawName || /^\[?unreadable\]?$/i.test(rawName);
    const unclearFieldSet = new Set(asFields(med.unclearFields));
    if (nameUnreadable) unclearFieldSet.add('medicineName');

    const strength = asText(med.strength);
    const dose = asText(med.dose);
    const frequency = asText(med.frequency);
    if (!strength) unclearFieldSet.add('strength');
    if (!dose) unclearFieldSet.add('dose');
    if (!frequency) unclearFieldSet.add('frequency');

    const timings = asTimings(med.timings);
    if (frequency && timings.length === 0 && !/sos|prn|as needed/i.test(frequency)) {
      unclearFieldSet.add('timings');
    }

    const unclearFields = [...unclearFieldSet];
    const unclear =
      nameUnreadable ||
      med.unclear === true ||
      unclearFields.length > 0;

    return {
      id: `med-${index + 1}`,
      medicineName: nameUnreadable ? '[Unreadable]' : (rawName as string),
      strength,
      dose,
      frequency,
      timings,
      foodInstruction: asText(med.foodInstruction),
      duration: asText(med.duration),
      route: asText(med.route),
      notes: asText(med.notes),
      unclear,
      unclearFields,
    };
  });

  const warnings = asWarnings(root.extractionWarnings ?? outer.extractionWarnings);
  if (medications.some(med => med.unclear) && warnings.length === 0) {
    warnings.push(
      'Some fields could not be read clearly. Compare them with the original prescription.'
    );
  }

  let confidence = asConfidence(root.confidence ?? outer.confidence);
  if (confidence === 'high' && medications.some(med => med.unclear)) {
    confidence = 'medium';
  }

  return {
    medications,
    patientName: asText(root.patientName ?? outer.patientName),
    doctorName: asText(root.doctorName ?? outer.doctorName),
    prescriptionDate: asDate(root.prescriptionDate ?? outer.prescriptionDate),
    rawText: asText(root.rawText ?? outer.rawText),
    extractionWarnings: warnings,
    confidence,
    source,
  };
}

/** Parse JSON even when a model wraps it in a markdown fence or short prose. */
export function parseExtractionResponse(
  text: string,
  source: ExtractionSource
): ExtractedPrescription {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first === -1 || last <= first) {
      throw new Error('The reader returned an unreadable result. Please try again.');
    }
    try {
      parsed = JSON.parse(cleaned.slice(first, last + 1));
    } catch {
      throw new Error('The reader returned an unreadable result. Please try again.');
    }
  }

  return normalizeExtraction(parsed, source);
}
