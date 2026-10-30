import type { ExtractedPrescription, MedicationEntry, GeminiExtractionResult } from '../types';

// ─── Demo Mode Synthetic Data ──────────────────────────────────────────────
const DEMO_EXTRACTION: ExtractedPrescription = {
  medications: [
    {
      id: 'med-demo-1',
      medicineName: 'Metformin',
      strength: '500mg',
      dose: '1 tablet',
      frequency: 'Twice daily (BD)',
      timings: ['morning', 'evening'],
      foodInstruction: 'After food',
      duration: '30 days',
      notes: null,
      unclear: false,
      unclearFields: [],
    },
    {
      id: 'med-demo-2',
      medicineName: 'Amlodipine',
      strength: '5mg',
      dose: '1 tablet',
      frequency: 'Once daily (OD)',
      timings: ['morning'],
      foodInstruction: 'Before food',
      duration: '30 days',
      notes: null,
      unclear: false,
      unclearFields: [],
    },
    {
      id: 'med-demo-3',
      medicineName: '[Unreadable]',
      strength: null,
      dose: null,
      frequency: null,
      timings: ['night'],
      foodInstruction: null,
      duration: null,
      notes: 'Handwriting unclear — please verify with prescribing doctor',
      unclear: true,
      unclearFields: ['medicineName', 'strength', 'dose', 'frequency'],
    },
  ],
  patientName: 'Ramaiah Naidu',
  doctorName: 'Dr. Suresh Kumar',
  prescriptionDate: '2026-10-28',
  rawText:
    'Pt: R. Naidu, 68M\nRx\n1. Metformin 500mg BD pc\n2. Amlodipine 5mg OD ac\n3. [illegible] hs\nDr. S. Kumar\n28/10/26',
  extractionWarnings: [
    'One medication name could not be read. Please verify with the original prescription.',
  ],
  confidence: 'medium',
};

// ─── Gemini Prompt ─────────────────────────────────────────────────────────
const EXTRACTION_PROMPT = `You are a prescription transcription assistant for RX-AID, a medical organisation tool used by family caregivers in India.

CRITICAL RULES:
1. Extract ONLY what is clearly visible on the prescription image.
2. If any field is unclear, partially visible, or ambiguous, set it to null and add the field name to "unclearFields".
3. NEVER guess or invent medicine names, dosages, or frequencies.
4. NEVER add medical precautions, contraindications, or advice not present on the prescription.
5. Mark unclear medicines with medicineName: "[Unreadable]" and unclear: true.
6. Recognise common Indian clinical shorthand: BD=twice daily, TDS/TID=three times, OD=once daily, hs=bedtime, ac=before food, pc=after food, SOS=as needed.

Return ONLY a valid JSON object with this structure (no markdown, no explanation):
{
  "medications": [
    {
      "id": "med-1",
      "medicineName": "string or [Unreadable]",
      "strength": "string or null",
      "dose": "string or null",
      "frequency": "string or null",
      "timings": ["morning"|"afternoon"|"evening"|"night"],
      "foodInstruction": "string or null",
      "duration": "string or null",
      "notes": "string or null",
      "unclear": false,
      "unclearFields": []
    }
  ],
  "patientName": "string or null",
  "doctorName": "string or null",
  "prescriptionDate": "YYYY-MM-DD or null",
  "rawText": "verbatim text you can read, or null",
  "extractionWarnings": ["array of warning strings"],
  "confidence": "high|medium|low|unclear"
}`;

// ─── Main Extraction Function ──────────────────────────────────────────────
export async function extractPrescriptionWithGemini(
  imageDataUrl: string,
): Promise<GeminiExtractionResult> {
  // Check if API key is available (backend would handle this, but for Vite dev we use env var)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'DEMO') {
    console.info('[RX-AID] Gemini API key not set — running in demo mode');
    // Simulate async processing delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    return {
      success: true,
      data: DEMO_EXTRACTION,
      error: null,
      demoMode: true,
    };
  }

  try {
    // Dynamically import to avoid bundling issues if key not present
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    // Strip the data URL prefix to get raw base64
    const base64 = imageDataUrl.split(',')[1];
    const mimeType = imageDataUrl.split(';')[0].split(':')[1] as
      | 'image/jpeg'
      | 'image/png'
      | 'image/webp';

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64,
              },
            },
            { text: EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    const rawText = response.text ?? '';

    // Parse JSON — strip any markdown fences if present
    const jsonStr = rawText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr) as ExtractedPrescription;

    // Assign IDs if missing
    parsed.medications = parsed.medications.map((m: MedicationEntry, i: number) => ({
      ...m,
      id: m.id ?? `med-${i + 1}`,
    }));

    return { success: true, data: parsed, error: null, demoMode: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during AI extraction';
    console.error('[RX-AID] Gemini extraction error:', message);
    return { success: false, data: null, error: message, demoMode: false };
  }
}
