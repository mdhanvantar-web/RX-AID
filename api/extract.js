import { GoogleGenAI, Type } from '@google/genai';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_BASE64_CHARS = 4_000_000; // keep the request under the serverless body limit

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

const RESPONSE_SCHEMA = {
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
  required: ['medications', 'extractionWarnings', 'confidence'],
};

function errorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (
    lower.includes('api key') ||
    lower.includes('permission') ||
    lower.includes('unauthenticated') ||
    lower.includes('403')
  ) {
    return 'The Gemini reader key was rejected. Check the server key and try again.';
  }
  if (lower.includes('quota') || lower.includes('429') || lower.includes('rate limit')) {
    return 'The reader is busy or has reached its quota. Wait a moment and try again.';
  }
  if (lower.includes('safety') || lower.includes('blocked')) {
    return 'The reader could not process this image. Try a clearer photo.';
  }
  if (lower.includes('json') || lower.includes('unreadable')) {
    return 'The reader returned an unclear result. Try again with a sharper photo.';
  }
  return message || 'The reader could not process this image.';
}

function parseJson(text) {
  const cleaned = String(text ?? '')
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first === -1 || last <= first) {
      throw new Error('The reader returned an unreadable result.');
    }
    return JSON.parse(cleaned.slice(first, last + 1));
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      configured: Boolean(process.env.GEMINI_API_KEY),
      model: MODEL,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(501).json({
      success: false,
      demoMode: true,
      error: 'No server-side Gemini key is configured.',
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid JSON body.' });
    }
  }

  const image = typeof body?.image === 'string' ? body.image : '';
  const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i.exec(image);
  if (!match) {
    return res
      .status(400)
      .json({ success: false, error: 'Send a JPEG, PNG, or WebP prescription image.' });
  }

  const mimeType = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
  const base64 = match[2].replace(/\s+/g, '');
  if (base64.length > MAX_BASE64_CHARS) {
    return res.status(413).json({
      success: false,
      error: 'That photo is too large. Try a smaller or lower-resolution image.',
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: EXTRACTION_PROMPT },
          ],
        },
      ],
      config: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const parsed = parseJson(response.text ?? '');
    if (!Array.isArray(parsed?.medications) || parsed.medications.length === 0) {
      return res.status(422).json({
        success: false,
        error: 'No medicines could be read from this image. Try a sharper, well-lit photo.',
      });
    }

    return res.status(200).json({ success: true, data: parsed, demoMode: false });
  } catch (error) {
    console.error('[RX-AID] /api/extract failed:', error);
    return res.status(502).json({ success: false, error: errorMessage(error) });
  }
}
