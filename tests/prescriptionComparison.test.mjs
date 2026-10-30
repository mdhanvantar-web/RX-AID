/* Synthetic comparison-engine tests for the RX-AID Prescription Change Detector.
   Run with: npm run test:comparison
   These use fictional medicines and instructions only. */

import assert from 'node:assert/strict';
import {
  computePrescriptionComparison,
  getUnresolvedMedicineFlags,
  normalizeStrength,
  normalizeFrequency,
  normalizeFood,
  normalizeMedicineName,
} from '../src/services/prescriptionComparison.ts';

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

let medCounter = 0;
function med(overrides = {}) {
  medCounter += 1;
  return {
    id: `med-${medCounter}`,
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
    ...overrides,
  };
}

function categories(result) {
  return result.items.map(item => item.category);
}

console.log('\nRX-AID Prescription Change Detector — synthetic tests\n');

console.log('1. Identical prescriptions');
test('two identical prescriptions produce only unchanged medicines', () => {
  const previous = [med({ medicineName: 'Metformin' }), med({ medicineName: 'Amlodipine', strength: '5mg', timings: ['morning'], frequency: 'Once daily (OD)' })];
  const next = previous.map(m => ({ ...m, id: `${m.id}-copy` }));
  const result = computePrescriptionComparison(previous, next);
  assert.equal(result.summary.total, 2);
  assert.equal(result.summary.unchanged, 2);
  assert.equal(result.summary.changed, 0);
  assert.equal(result.summary.needsReview, 0);
  assert.deepEqual(categories(result), ['unchanged', 'unchanged']);
});

test('formatting differences (500 mg vs 500mg, BD vs twice daily) do not count as changes', () => {
  const previous = [med({ medicineName: 'Tab. Metformin', strength: '500 mg', frequency: 'BD' })];
  const next = [med({ medicineName: 'Metformin', strength: '500mg', frequency: 'twice daily' })];
  const result = computePrescriptionComparison(previous, next);
  assert.equal(result.items[0].matchType, 'exact');
  assert.equal(result.items[0].category, 'unchanged');
  assert.equal(result.items[0].diffs.length, 0);
});

console.log('\n2. Newly added medicine');
test('a medicine only in the new prescription is categorised as added', () => {
  const previous = [med({ medicineName: 'Metformin' })];
  const next = [med({ medicineName: 'Metformin' }), med({ medicineName: 'Atorvastatin', strength: '10mg' })];
  const result = computePrescriptionComparison(previous, next);
  assert.equal(result.summary.added, 1);
  assert.equal(result.summary.unchanged, 1);
  const added = result.items.find(i => i.category === 'added');
  assert.equal(added.next.medicineName, 'Atorvastatin');
  assert.equal(added.previous, null);
});

console.log('\n3. Medicine missing from new prescription');
test('an absent medicine is "removed", never silently discontinued', () => {
  const previous = [med({ medicineName: 'Metformin' }), med({ medicineName: 'Amlodipine', strength: '5mg' })];
  const next = [med({ medicineName: 'Metformin' })];
  const result = computePrescriptionComparison(previous, next);
  assert.equal(result.summary.removed, 1);
  const removed = result.items.find(i => i.category === 'removed');
  assert.equal(removed.previous.medicineName, 'Amlodipine');
  assert.equal(removed.next, null);
  assert.match(removed.reviewReasons.join(' '), /not confirmation that the medicine was stopped/i);
});

console.log('\n4. Changed strength');
test('a different strength is a field-level changed item', () => {
  const previous = [med({ strength: '500mg' })];
  const next = [med({ strength: '1000mg' })];
  const result = computePrescriptionComparison(previous, next);
  assert.equal(result.items[0].category, 'changed');
  const diff = result.items[0].diffs.find(d => d.field === 'strength');
  assert.ok(diff);
  assert.equal(diff.previousValue, '500mg');
  assert.equal(diff.newValue, '1000mg');
});

console.log('\n5. Changed dosage');
test('a different dose is detected and original values are preserved', () => {
  const previous = [med({ dose: '1 tablet' })];
  const next = [med({ dose: '2 tablets' })];
  const result = computePrescriptionComparison(previous, next);
  assert.equal(result.items[0].category, 'changed');
  const diff = result.items[0].diffs.find(d => d.field === 'dose');
  assert.ok(diff);
  assert.equal(diff.previousValue, '1 tablet');
  assert.equal(diff.newValue, '2 tablets');
});

console.log('\n6. Changed frequency');
test('BD to OD is a frequency change', () => {
  const previous = [med({ frequency: 'Twice daily (BD)' })];
  const next = [med({ frequency: 'Once daily (OD)', timings: ['morning'] })];
  const result = computePrescriptionComparison(previous, next);
  assert.equal(result.items[0].category, 'changed');
  assert.ok(result.items[0].diffs.some(d => d.field === 'frequency'));
});

console.log('\n7. Changed duration');
test('a different duration is detected', () => {
  const previous = [med({ duration: '30 days' })];
  const next = [med({ duration: '90 days' })];
  const result = computePrescriptionComparison(previous, next);
  assert.equal(result.items[0].category, 'changed');
  const diff = result.items[0].diffs.find(d => d.field === 'duration');
  assert.equal(diff.previousValue, '30 days');
  assert.equal(diff.newValue, '90 days');
});

console.log('\n8. Different medicine names / uncertain matching');
test('similar spellings are paired but always need manual review', () => {
  const previous = [med({ medicineName: 'Metformin' })];
  const next = [med({ medicineName: 'Metformine' })];
  const result = computePrescriptionComparison(previous, next);
  assert.equal(result.items[0].matchType, 'uncertain');
  assert.equal(result.items[0].category, 'needs_review');
  assert.match(result.items[0].reviewReasons.join(' '), /similar but not identical/i);
});

test('clearly different names are never treated as the same medicine', () => {
  const previous = [med({ medicineName: 'Metformin' })];
  const next = [med({ medicineName: 'Amlodipine', strength: '5mg' })];
  const result = computePrescriptionComparison(previous, next);
  assert.equal(result.items.length, 2);
  const removed = result.items.find(i => i.category === 'removed');
  const added = result.items.find(i => i.category === 'added');
  assert.ok(removed);
  assert.ok(added);
  assert.equal(result.items.some(i => i.matchType !== 'none'), false);
});

console.log('\n9. Poor handwriting');
test('unreadable new entries are needs_review and never matched', () => {
  const previous = [med({ medicineName: 'Metformin' })];
  const next = [med({
    medicineName: '[Unreadable]',
    strength: null,
    dose: null,
    frequency: null,
    timings: ['night'],
    foodInstruction: null,
    duration: null,
    notes: 'Handwriting unclear',
    unclear: true,
    unclearFields: ['medicineName', 'strength', 'dose', 'frequency'],
  })];
  const result = computePrescriptionComparison(previous, next);
  const reviewItem = result.items.find(i => i.next?.unclear);
  assert.ok(reviewItem);
  assert.equal(reviewItem.category, 'needs_review');
  assert.equal(result.summary.needsReview >= 1, true);
  assert.match(result.warnings.join(' '), /manual review/i);
});

console.log('\n10. Multiple medicines with possible duplicates');
test('duplicate medicine names are flagged for review', () => {
  const previous = [med({ medicineName: 'Metformin', dose: '1 tablet' })];
  const next = [
    med({ medicineName: 'Metformin', dose: '1 tablet' }),
    med({ medicineName: 'Metformin', dose: '2 tablets' }),
  ];
  const result = computePrescriptionComparison(previous, next);
  assert.equal(result.summary.needsReview >= 1, true);
  const flagged = result.items.filter(i => i.category === 'needs_review');
  assert.ok(flagged.length >= 1);
  assert.match(flagged.map(i => i.reviewReasons.join(' ')).join(' '), /duplicate/i);
});

test('normalisation preserves meaning while ignoring formatting', () => {
  assert.equal(normalizeStrength('500 mg'), normalizeStrength('500mg'));
  assert.equal(normalizeFrequency('BD'), 'twice daily');
  assert.equal(normalizeFrequency('1-0-1'), 'twice daily');
  assert.equal(normalizeFood('pc'), 'after food');
  assert.equal(normalizeMedicineName('Tab. Metformin 500mg'), 'metformin 500mg');
});

test('timing/frequency conflict is flagged for review', () => {
  const previous = [med({ medicineName: 'Metformin', frequency: 'Once daily', timings: ['morning', 'night'] })];
  const next = [med({ medicineName: 'Metformin', frequency: 'Once daily', timings: ['morning', 'night'] })];
  const result = computePrescriptionComparison(previous, next);
  assert.equal(result.items[0].category, 'needs_review');
  assert.match(result.items[0].reviewReasons.join(' '), /timing entries appear to disagree/i);
});

console.log('\nPharmacy / cart unresolved-change flags');
function prescription(overrides) {
  return {
    id: 'rx',
    imageDataUrl: '',
    imageFileName: 'synthetic.jpg',
    uploadedAt: '2026-10-01T09:00:00.000Z',
    status: 'extracted',
    extracted: null,
    verified: null,
    errorMessage: null,
    ...overrides,
  };
}

function comparisonRecord(overrides = {}) {
  return {
    id: 'cmp-test',
    previousPrescriptionId: 'rx-active',
    newPrescriptionId: 'rx-draft',
    createdAt: '2026-10-02T09:00:00.000Z',
    status: 'pending',
    result: {
      items: [
        {
          id: 'item-1',
          category: 'changed',
          previous: med({ medicineName: 'Metformin', strength: '500mg' }),
          next: med({ medicineName: 'Metformin', strength: '1000mg' }),
          matchType: 'exact',
          diffs: [],
          reviewReasons: [],
        },
      ],
      summary: { total: 1, unchanged: 0, added: 0, changed: 1, removed: 0, needsReview: 0 },
      warnings: [],
      generatedAt: '2026-10-02T09:00:00.000Z',
    },
    ...overrides,
  };
}

test('a newer unverified draft flags changed medicines for clarification', () => {
  const active = prescription({
    id: 'rx-active',
    status: 'active',
    uploadedAt: '2026-10-01T09:00:00.000Z',
  });
  const draft = prescription({ id: 'rx-draft', uploadedAt: '2026-10-02T09:00:00.000Z' });
  const flags = getUnresolvedMedicineFlags([comparisonRecord()], [active, draft]);
  assert.equal(Object.keys(flags).length, 1);
  assert.equal(flags.metformin.category, 'changed');
});

test('a stale draft older than the active version does not block the current list', () => {
  const draft = prescription({ id: 'rx-draft', uploadedAt: '2026-09-01T09:00:00.000Z' });
  const active = prescription({
    id: 'rx-active',
    status: 'active',
    uploadedAt: '2026-10-01T09:00:00.000Z',
  });
  const flags = getUnresolvedMedicineFlags([comparisonRecord()], [active, draft]);
  assert.equal(Object.keys(flags).length, 0);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exitCode = 1;
