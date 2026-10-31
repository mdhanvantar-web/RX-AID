/* Extraction-normalisation tests for the RX-AID prescription reader.
   Run with: npm run test:extraction
   Uses fictional prescriptions only; no API key or network access is needed. */

import assert from 'node:assert/strict';
import {
  normalizeExtraction,
  parseExtractionResponse,
} from '../src/services/extractionNormalize.ts';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
  }
}

const full = {
  medications: [
    {
      medicineName: 'Metformin',
      strength: '500mg',
      dose: '1 tablet',
      frequency: 'Twice daily',
      timings: ['morning', 'evening'],
      foodInstruction: 'After food',
      duration: '30 days',
      route: null,
      notes: null,
      unclear: false,
      unclearFields: [],
    },
  ],
  patientName: 'Ramaiah Naidu',
  doctorName: 'Dr. Suresh Kumar',
  prescriptionDate: '2026-10-28',
  rawText: 'Metformin 500mg BD pc',
  extractionWarnings: [],
  confidence: 'high',
};

test('normalises a complete extraction and sets the source', () => {
  const result = normalizeExtraction(full, 'gemini');
  assert.equal(result.source, 'gemini');
  assert.equal(result.medications.length, 1);
  assert.equal(result.medications[0].medicineName, 'Metformin');
  assert.equal(result.medications[0].strength, '500mg');
  assert.deepEqual(result.medications[0].timings, ['morning', 'evening']);
  assert.equal(result.confidence, 'high');
  assert.equal(result.prescriptionDate, '2026-10-28');
});

test('assigns stable local medicine ids', () => {
  const result = normalizeExtraction(full, 'gemini');
  assert.deepEqual(result.medications.map(med => med.id), ['med-1']);
});

test('parses markdown-fenced JSON', () => {
  const text = '```json\n' + JSON.stringify(full) + '\n```';
  const result = parseExtractionResponse(text, 'gemini');
  assert.equal(result.medications[0].medicineName, 'Metformin');
});

test('recovers JSON wrapped in short prose', () => {
  const text = `Here is the transcription: ${JSON.stringify(full)}`;
  const result = parseExtractionResponse(text, 'gemini');
  assert.equal(result.medications.length, 1);
});

test('rejects an empty medicine list', () => {
  assert.throws(
    () => normalizeExtraction({ medications: [] }, 'gemini'),
    /No medicines could be read/
  );
});

test('marks an unreadable name as unclear', () => {
  const result = normalizeExtraction(
    {
      medications: [
        { medicineName: '[Unreadable]', timings: ['night'], unclear: false, unclearFields: [] },
      ],
      confidence: 'high',
    },
    'gemini'
  );
  const med = result.medications[0];
  assert.equal(med.medicineName, '[Unreadable]');
  assert.equal(med.unclear, true);
  assert.ok(med.unclearFields.includes('medicineName'));
  assert.equal(result.confidence, 'medium');
});

test('does not let high confidence survive an unclear medicine', () => {
  const result = normalizeExtraction(
    {
      medications: [
        { medicineName: 'Amlodipine', strength: null, timings: [], unclear: true, unclearFields: ['strength'] },
      ],
      confidence: 'high',
    },
    'gemini'
  );
  assert.equal(result.confidence, 'medium');
});

test('filters invalid timings and de-duplicates valid ones', () => {
  const result = normalizeExtraction(
    {
      medications: [
        {
          medicineName: 'Atorvastatin',
          timings: ['night', 'NIGHT', 'bedtime', 'afternoon'],
          unclear: false,
          unclearFields: [],
        },
      ],
      confidence: 'medium',
    },
    'gemini'
  );
  assert.deepEqual(result.medications[0].timings, ['afternoon', 'night']);
});

test('keeps numeric strengths as text', () => {
  const result = normalizeExtraction(
    {
      medications: [
        { medicineName: 'Levothyroxine', strength: 50, timings: ['morning'], unclear: false, unclearFields: [] },
      ],
      confidence: 'high',
    },
    'gemini'
  );
  assert.equal(result.medications[0].strength, '50');
});

test('unwraps a nested prescription object', () => {
  const result = normalizeExtraction({ prescription: full }, 'gemini');
  assert.equal(result.medications.length, 1);
  assert.equal(result.patientName, 'Ramaiah Naidu');
});

test('drops invalid dates and unknown confidence values', () => {
  const result = normalizeExtraction(
    {
      medications: [
        { medicineName: 'Cetirizine', timings: [], unclear: false, unclearFields: [] },
      ],
      prescriptionDate: '28/10/2026',
      confidence: 'certain',
    },
    'gemini'
  );
  assert.equal(result.prescriptionDate, null);
  assert.equal(result.confidence, 'medium');
});

test('adds a warning when an unclear medicine has none', () => {
  const result = normalizeExtraction(
    {
      medications: [
        { medicineName: '[Unreadable]', timings: [], unclear: true, unclearFields: [] },
      ],
      extractionWarnings: [],
      confidence: 'low',
    },
    'gemini'
  );
  assert.equal(result.extractionWarnings.length, 1);
  assert.match(result.extractionWarnings[0], /could not be read clearly/i);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exitCode = 1;
