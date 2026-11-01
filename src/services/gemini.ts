import type { ExtractedPrescription, GeminiExtractionResult } from '../types';
import { SAMPLE_MEDICATIONS } from './demoData';
import {
  normalizeExtraction,
  parseExtractionResponse,
} from './extractionNormalize';

const STORAGE_KEY = 'rxaid_gemini_api_key';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];
const MAX_IMAGE_SIDE = 2000;


// ─── Sample extraction (used when no reader key is configured) ─────────────
const SAMPLE_EXTRACTION: ExtractedPrescription = {
  medications: [
    ...SAMPLE_MEDICATIONS.map(med => ({ ...med })),
    {
      id: 'sample-med-7',
      medicineName: '[Unreadable]',
      strength: null,
      dose: null,
      frequency: null,
      timings: ['night'],
      foodInstruction: null,
      duration: null,
      notes: 'Handwriting unclear — please verify with the prescribing doctor',
      route: null,
      unclear: true,
      unclearFields: ['medicineName', 'strength', 'dose', 'frequency'],
    },
  ],
  patientName: 'Ramaiah Naidu',
  doctorName: 'Dr. Suresh Kumar',
  prescriptionDate: '2026-10-28',
  rawText:
    'Pt: R. Naidu, 68M\nRx\n1. Metformin 500mg BD pc\n2. Amlodipine 5mg OD ac\n3. Atorvastatin 10mg OD hs\n4. Telmisartan 40mg OD\n5. Pantoprazole 40mg OD ac\n6. Levothyroxine 50mcg OD ac\n7. [illegible] hs\nDr. S. Kumar\n28/10/26',
  extractionWarnings: [
    'One medication name could not be read. Please verify with the original prescription.',
  ],
  confidence: 'medium',
  source: 'demo',
};

// ─── Gemini prompt ─────────────────────────────────────────────────────────
const EXTRACTION_PROMPT = `You are an expert prescription transcription assistant for RX-AID, a medication-organisation tool used by family caregivers in India.

TASK
Read the prescription image and transcribe every medicine exactly as it is written. You are a careful data-entry assistant, not a doctor.

HARD SAFETY RULES
1. Extract ONLY what is visibly written. Never guess, invent, or complete a medicine name, strength, dose, frequency, or duration.
2. Do not substitute a brand for a generic or a generic for a brand. Keep the name exactly as written.
3. Do not add medical advice, precautions, diagnoses, or contraindications.
4. If a medicine name is illegible, set medicineName to "[Unreadable]" and list the affected fields in unclearFields.
5. If a number, decimal point, or unit is ambiguous (for example 1 vs 7, 5 vs 6, mg vs mcg), set that field to null, add it to unclearFields, and mention it in extractionWarnings.
6. Set confidence to "high" only when every medicine and every instruction is clear. Use "medium", "low", or "unclear" otherwise. Never claim high confidence when any medicine is unclear.

READING RULES
- Ignore printed clinic letterheads, addresses, registration numbers, and advertising. Focus on the Rx area.
- Treat each numbered, bulleted, or clearly separated medicine line as a separate medication. Never merge two medicines into one entry.
- Separate the medicine name from the strength and dose. Example: "Tab. Metformin 500 mg 1-0-1 pc" becomes medicineName "Metformin", strength "500mg", dose "1 tablet", frequency "Twice daily", timings ["morning","evening"], foodInstruction "After food".
- Preserve the exact strength including units and combinations: "500mg", "5mcg", "10/12.5mg", "0.5mg".
- Preserve the dose unit: "1 tablet", "2 tablets", "5ml", "10 units", "1 puff", "1 sachet".
- Duration: keep what is written, for example "5 days", "30 days", "1 month", "continue".
- Route: fill this ONLY when the route is explicitly written (oral, topical, inhaled, IV, SC, eye drops, ear drops, nasal). Otherwise null.
- notes: use for clearly written special instructions such as "SOS for fever", "taper", "apply twice daily", or "take 30 minutes before breakfast". Do not move frequency or dose into notes.

FREQUENCY & TIMING
- OD / once daily -> one timing; BD / BID / twice daily -> morning and evening; TDS / TID / three times -> morning, afternoon, evening; QID / four times -> morning, afternoon, evening, night; HS / bedtime -> night; SOS / PRN -> as needed, leave timings empty unless a time is written.
- Indian slot notation: 1-0-1 -> morning and evening; 1-1-1 -> morning, afternoon, evening; 0-0-1 -> night; 1-0-0 -> morning; 0-1-0 -> afternoon.
- ac / before food -> "Before food"; pc / after food -> "After food"; with food -> "With food". Only use these when written.
- If the frequency is written but the timing is not clear, keep the frequency text and leave timings empty. Do not invent a time.

Also transcribe any clearly visible patient name, doctor name, prescription date (YYYY-MM-DD), and the raw text of the prescription. If those are not visible or unclear, use null.

Return ONLY valid JSON matching the provided schema. No markdown, no commentary.`;

// ─── Reader configuration ──────────────────────────────────────────────────
export interface ReaderStatus {
  live: boolean;
  source: 'local' | 'server' | 'demo';
  model?: string;
}

function envKey(): string | null {
  const key = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!key || !key.trim() || key === 'DEMO') return null;
  return key.trim();
}

function modelName(): string {
  const configured = import.meta.env.VITE_GEMINI_MODEL as string | undefined;
  return configured?.trim() || DEFAULT_MODEL;
}

export function getStoredGeminiApiKey(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && stored.trim() ? stored.trim() : null;
  } catch {
    return null;
  }
}

export function setStoredGeminiApiKey(key: string | null): void {
  try {
    if (key && key.trim()) localStorage.setItem(STORAGE_KEY, key.trim());
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private modes; the in-memory flow still works.
  }
}

function directKey(): string | null {
  return getStoredGeminiApiKey() ?? envKey();
}

export function getLocalReaderStatus(): ReaderStatus {
  return directKey()
    ? { live: true, source: 'local', model: modelName() }
    : { live: false, source: 'demo' };
}

/** Check whether the server-side reader has a key configured. */
export async function getReaderStatus(): Promise<ReaderStatus> {
  if (directKey()) return getLocalReaderStatus();

  try {
    const response = await fetch('/api/extract', {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    const contentType = response.headers.get('content-type') ?? '';
    if (!response.ok || !contentType.includes('application/json')) {
      return { live: false, source: 'demo' };
    }
    const status = (await response.json()) as {
      configured?: boolean;
      model?: string;
    };
    if (status.configured) {
      return { live: true, source: 'server', model: status.model };
    }
  } catch {
    // No serverless function (local preview) or offline.
  }

  return { live: false, source: 'demo' };
}

// ─── Image preparation ─────────────────────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error('Could not open that photo. Please try another image.'));
    image.src = src;
  });
}

/**
 * Downscale very large photos before sending them to Gemini. This keeps the
 * upload fast and below serverless request limits without losing handwriting.
 */
async function prepareImage(dataUrl: string): Promise<string> {
  if (typeof document === 'undefined') return dataUrl;

  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return dataUrl;

  let scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  let best = dataUrl;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.9, 0.82, 0.74, 0.66, 0.58]) {
      const result = canvas.toDataURL('image/jpeg', quality);
      if (result.length <= 1050000) return result;
      if (result.length < best.length) best = result;
    }

    scale *= 0.78;
    if (scale < 0.25) break;
  }

  return best;
}

function splitDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!match) throw new Error('Unsupported image format.');
  return { mimeType: match[1], base64: match[2] };
}

// ─── Extraction ────────────────────────────────────────────────────────────
export async function extractPrescriptionWithGemini(
  imageDataUrl: string
): Promise<GeminiExtractionResult> {
  const key = directKey();
  if (key) return extractDirect(imageDataUrl, key);

  if (import.meta.env.PROD) {
    const proxied = await extractViaProxy(imageDataUrl);
    if (proxied) return proxied;
  }

  return sampleResult();
}

export async function extractSamplePrescription(): Promise<GeminiExtractionResult> {
  return sampleResult();
}

async function sampleResult(): Promise<GeminiExtractionResult> {
  await new Promise(resolve => setTimeout(resolve, 1200));
  return {
    success: true,
    data: normalizeExtraction(SAMPLE_EXTRACTION, 'demo'),
    error: null,
    demoMode: true,
  };
}

async function extractViaProxy(
  imageDataUrl: string
): Promise<GeminiExtractionResult | null> {
  let prepared: string;
  try {
    prepared = await prepareImage(imageDataUrl);
  } catch (error) {
    return failure(friendlyError(error));
  }

  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image: prepared }),
    });
    const contentType = response.headers.get('content-type') ?? '';
    // vite preview and static hosts return index.html for unknown routes.
    if (!contentType.includes('application/json')) return null;

    const payload = (await response.json()) as {
      success?: boolean;
      data?: unknown;
      error?: string;
      demoMode?: boolean;
    };

    if (response.status === 501 || payload.demoMode) {
      return sampleResult();
    }
    if (!response.ok || !payload.success || !payload.data) {
      return failure(payload.error ?? friendlyError(null));
    }

    return {
      success: true,
      data: normalizeExtraction(payload.data, 'gemini'),
      error: null,
      demoMode: false,
    };
  } catch (error) {
    return failure(friendlyError(error));
  }
}

async function extractDirect(
  imageDataUrl: string,
  apiKey: string
): Promise<GeminiExtractionResult> {
  let prepared: string;
  try {
    prepared = await prepareImage(imageDataUrl);
  } catch (error) {
    return failure(friendlyError(error));
  }

  const { mimeType, base64 } = splitDataUrl(prepared);
  const models = [...new Set([modelName(), ...FALLBACK_MODELS])];
  let lastError: unknown = null;

  try {
    const { GoogleGenAI, Type } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
                    data: base64,
                  },
                },
                { text: EXTRACTION_PROMPT },
              ],
            },
          ],
          config: {
            temperature: 0,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                medications: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      medicineName: { type: Type.STRING, nullable: true },
                      strength: { type: Type.STRING, nullable: true },
                      dose: { type: Type.STRING, nullable: true },
                      frequency: { type: Type.STRING, nullable: true },
                      timings: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.STRING,
                          enum: ['morning', 'afternoon', 'evening', 'night'],
                        },
                      },
                      foodInstruction: { type: Type.STRING, nullable: true },
                      duration: { type: Type.STRING, nullable: true },
                      route: { type: Type.STRING, nullable: true },
                      notes: { type: Type.STRING, nullable: true },
                      unclear: { type: Type.BOOLEAN },
                      unclearFields: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['medicineName', 'timings', 'unclear', 'unclearFields'],
                  },
                },
                patientName: { type: Type.STRING, nullable: true },
                doctorName: { type: Type.STRING, nullable: true },
                prescriptionDate: { type: Type.STRING, nullable: true },
                rawText: { type: Type.STRING, nullable: true },
                extractionWarnings: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                confidence: {
                  type: Type.STRING,
                  enum: ['high', 'medium', 'low', 'unclear'],
                },
              },
              required: [
                'medications',
                'extractionWarnings',
                'confidence',
              ],
            },
          },
        });

        const parsed = parseExtractionResponse(response.text ?? '', 'gemini');
        return { success: true, data: parsed, error: null, demoMode: false };
      } catch (error) {
        lastError = error;
        if (!isModelUnavailable(error)) break;
      }
    }
  } catch (error) {
    lastError = error;
  }

  console.error('[RX-AID] Gemini extraction error:', lastError);
  return failure(friendlyError(lastError));
}

function isModelUnavailable(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes('not found') ||
    message.includes('not supported') ||
    message.includes('404') ||
    message.includes('no longer available')
  );
}

function friendlyError(error: unknown): string {
  if (!error) return 'AI extraction failed. Please try again.';
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    lower.includes('api key') ||
    lower.includes('permission') ||
    lower.includes('unauthenticated') ||
    lower.includes('403')
  ) {
    return 'The Gemini reader key was rejected. Check the key and try again.';
  }
  if (lower.includes('quota') || lower.includes('429') || lower.includes('rate limit')) {
    return 'The reader is busy or has reached its quota. Wait a moment and try again.';
  }
  if (lower.includes('safety') || lower.includes('blocked')) {
    return 'The reader could not process this image. Try a clearer photo.';
  }
  if (lower.includes('json') || lower.includes('unreadable result')) {
    return 'The reader returned an unclear result. Try again with a sharper photo.';
  }
  if (
    lower.includes('fetch') ||
    lower.includes('network') ||
    lower.includes('failed to fetch')
  ) {
    return 'Could not reach the Gemini reader. Check your connection and try again.';
  }

  return message;
}

function failure(error: string): GeminiExtractionResult {
  return { success: false, data: null, error, demoMode: false };
}
