import type {
  ComparedMedicine,
  ComparisonCategory,
  ComparisonFieldDiff,
  ComparisonSummary,
  MedicationEntry,
  MedicineMatchType,
  Prescription,
  PrescriptionComparisonRecord,
  PrescriptionComparisonResult,
} from '../types';

/* ────────────────────────────────────────────────────────────────
   Normalisation helpers
   These only normalise formatting for COMPARISON. Original values
   are always preserved and shown to the caregiver unchanged.
   ──────────────────────────────────────────────────────────────── */

const DOSAGE_FORM_TOKENS =
  /\b(tablets?|tabs?|capsules?|caps?|syrups?|syp|injections?|inj|ointments?|oint|drops?|suspensions?|susp)\b/g;

const UNREADABLE_PATTERN = /unreadable|illegible|cannot read|unknown medicine|\?\?\?/i;

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeMedicineName(name: string | null | undefined): string {
  if (!name) return '';
  return collapse(
    name
      .toLowerCase()
      .replace(DOSAGE_FORM_TOKENS, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
  );
}

export function normalizeStrength(value: string | null | undefined): string {
  if (!value) return '';
  return collapse(
    value
      .toLowerCase()
      .replace(/(\d)\s+(mg|mcg|g|ml|iu|units?|%)\b/g, '$1$2')
      .replace(/\bmicrograms?\b|\bµg\b|\bug\b/g, 'mcg')
      .replace(/\bmilligrams?\b/g, 'mg')
      .replace(/\bgrams?\b/g, 'g')
      .replace(/\bmillilit(?:re|er)s?\b/g, 'ml')
      .replace(/\biu\b/g, 'unit')
      .replace(/\bunits?\b/g, 'unit')
      .replace(/[^a-z0-9.%/\s]/g, ' ')
  );
}

export function normalizeDose(value: string | null | undefined): string {
  if (!value) return '';
  return collapse(
    value
      .toLowerCase()
      .replace(/\btabs?\b/g, 'tablet')
      .replace(/\bcaps?\b/g, 'capsule')
      .replace(/\bteaspoonfuls?\b/g, 'teaspoon')
      .replace(/\btablespoonfuls?\b/g, 'tablespoon')
      .replace(/\bmls?\b/g, 'ml')
      .replace(/[^a-z0-9./\s]/g, ' ')
  );
}

const FREQUENCY_MAP: Array<[RegExp, string]> = [
  [/\b(od|o\.d|once daily|once a day|one time daily|1 time daily|1-0-0|0-0-1)\b/, 'once daily'],
  [/\b(bd|b\.d|bid|twice daily|twice a day|two times daily|2 times daily|1-0-1)\b/, 'twice daily'],
  [/\b(tds|t\.d\.s|tid|thrice daily|three times daily|3 times daily|three times a day|1-1-1)\b/, 'three times daily'],
  [/\b(qid|q\.i\.d|four times daily|4 times daily|1-1-1-1)\b/, 'four times daily'],
  [/\b(hs|h\.s|at bedtime|bedtime|at night)\b/, 'at bedtime'],
  [/\b(sos|s\.o\.s|prn|as needed|when required)\b/, 'as needed'],
];

export function normalizeFrequency(value: string | null | undefined): string {
  if (!value) return '';
  const base = collapse(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s/-]/g, ' ')
  );
  for (const [pattern, canonical] of FREQUENCY_MAP) {
    if (pattern.test(base)) return canonical;
  }
  return base;
}

export function normalizeFood(value: string | null | undefined): string {
  if (!value) return '';
  const base = collapse(value.toLowerCase());
  if (/\b(ac|a\.c|before food|before meals?|empty stomach)\b/.test(base)) return 'before food';
  if (/\b(pc|p\.c|after food|after meals?)\b/.test(base)) return 'after food';
  if (/\b(with food|with meals?)\b/.test(base)) return 'with food';
  return base;
}

export function normalizeDuration(value: string | null | undefined): string {
  if (!value) return '';
  return collapse(
    value
      .toLowerCase()
      .replace(/\bdays?\b/g, 'day')
      .replace(/\bweeks?\b/g, 'week')
      .replace(/\bmonths?\b/g, 'month')
      .replace(/[^a-z0-9/\s]/g, ' ')
  );
}

export function normalizeRoute(value: string | null | undefined): string {
  if (!value) return '';
  return collapse(value.toLowerCase().replace(/[^a-z0-9\s]/g, ' '));
}

export function isUnreadableName(name: string | null | undefined): boolean {
  return !name || UNREADABLE_PATTERN.test(name);
}

/* ────────────────────────────────────────────────────────────────
   Cautious name matching
   Exact normalised names match. Similar names (>= 0.9 similarity)
   are paired but marked "uncertain" for manual review. Different
   names are never assumed equivalent.
   ──────────────────────────────────────────────────────────────── */

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[rows - 1][cols - 1];
}

export function nameSimilarity(a: string, b: string): number {
  const left = a.replace(/[^a-z0-9]/g, '');
  const right = b.replace(/[^a-z0-9]/g, '');
  if (!left || !right) return 0;
  if (left === right) return 1;
  const longest = Math.max(left.length, right.length);
  return 1 - levenshtein(left, right) / longest;
}

/* ────────────────────────────────────────────────────────────────
   Field-level comparison
   ──────────────────────────────────────────────────────────────── */

interface FieldSpec {
  field: keyof MedicationEntry;
  label: string;
  normalize: (med: MedicationEntry) => string;
  display: (med: MedicationEntry) => string | null;
}

function textOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function displayTimings(med: MedicationEntry): string | null {
  if (!med.timings || med.timings.length === 0) return null;
  return med.timings.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
}

const FIELD_SPECS: FieldSpec[] = [
  {
    field: 'strength',
    label: 'Strength',
    normalize: m => normalizeStrength(m.strength),
    display: m => textOrNull(m.strength),
  },
  {
    field: 'dose',
    label: 'Dose',
    normalize: m => normalizeDose(m.dose),
    display: m => textOrNull(m.dose),
  },
  {
    field: 'frequency',
    label: 'Frequency',
    normalize: m => normalizeFrequency(m.frequency),
    display: m => textOrNull(m.frequency),
  },
  {
    field: 'route',
    label: 'Route',
    normalize: m => normalizeRoute(m.route),
    display: m => textOrNull(m.route),
  },
  {
    field: 'timings',
    label: 'Timing',
    normalize: m => [...(m.timings ?? [])].sort().join('|'),
    display: displayTimings,
  },
  {
    field: 'foodInstruction',
    label: 'Food instruction',
    normalize: m => normalizeFood(m.foodInstruction),
    display: m => textOrNull(m.foodInstruction),
  },
  {
    field: 'duration',
    label: 'Duration',
    normalize: m => normalizeDuration(m.duration),
    display: m => textOrNull(m.duration),
  },
  {
    field: 'notes',
    label: 'Additional instructions',
    normalize: m => collapse((m.notes ?? '').toLowerCase()),
    display: m => textOrNull(m.notes),
  },
];

export function buildFieldDiffs(previous: MedicationEntry, next: MedicationEntry): ComparisonFieldDiff[] {
  const diffs: ComparisonFieldDiff[] = [];
  for (const spec of FIELD_SPECS) {
    if (spec.normalize(previous) !== spec.normalize(next)) {
      diffs.push({
        field: spec.field,
        label: spec.label,
        previousValue: spec.display(previous),
        newValue: spec.display(next),
        changed: true,
      });
    }
  }
  return diffs;
}

/* ────────────────────────────────────────────────────────────────
   Review-reason detection
   ──────────────────────────────────────────────────────────────── */

function nameKeyCounts(meds: MedicationEntry[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const med of meds) {
    const key = normalizeMedicineName(med.medicineName);
    if (!key || isUnreadableName(med.medicineName)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function expectedDosesPerDay(frequency: string | null): number | null {
  const canonical = normalizeFrequency(frequency);
  switch (canonical) {
    case 'once daily':
    case 'at bedtime':
      return 1;
    case 'twice daily':
      return 2;
    case 'three times daily':
      return 3;
    case 'four times daily':
      return 4;
    default:
      return null;
  }
}

function missingFieldsOnNew(
  previous: MedicationEntry,
  next: MedicationEntry
): string[] {
  const reasons: string[] = [];
  const specs = FIELD_SPECS.filter(spec =>
    ['strength', 'dose', 'frequency', 'route', 'foodInstruction', 'duration'].includes(String(spec.field))
  );
  for (const spec of specs) {
    const previousValue = spec.display(previous);
    const nextValue = spec.display(next);
    if (previousValue && !nextValue) {
      reasons.push(
        `The new prescription does not state ${spec.label.toLowerCase()}. This is treated as missing information, not as a stopped instruction.`
      );
    }
  }
  return reasons;
}

function timingConflicts(med: MedicationEntry, sideLabel: string): string[] {
  const expected = expectedDosesPerDay(med.frequency);
  if (expected && med.timings.length > 0 && med.timings.length !== expected) {
    return [
      `${sideLabel} frequency and timing entries appear to disagree (${med.frequency} but ${med.timings.length} timing slot${med.timings.length === 1 ? '' : 's'} recorded).`,
    ];
  }
  return [];
}

function collectReviewReasons(
  previous: MedicationEntry,
  next: MedicationEntry,
  matchType: MedicineMatchType,
  previousDuplicate: boolean,
  nextDuplicate: boolean
): string[] {
  const reasons: string[] = [];

  if (matchType === 'uncertain') {
    reasons.push(
      'The medicine names are similar but not identical. Do not assume they are the same medicine — ask a pharmacist or the prescribing doctor.'
    );
  }

  if (previousDuplicate || nextDuplicate) {
    reasons.push(
      'This medicine name appears more than once in one of the prescriptions. A possible duplicate entry needs manual checking.'
    );
  }

  if (isUnreadableName(previous.medicineName)) {
    reasons.push('The previous prescription entry was unreadable or unclear.');
  }
  if (isUnreadableName(next.medicineName)) {
    reasons.push('The new prescription entry was unreadable or unclear.');
  }

  if (previous.unclear) {
    reasons.push('The previous prescription entry was marked as unclear during review.');
  }
  if (next.unclear) {
    reasons.push('The new prescription entry is marked as unclear and has not been verified.');
  }

  if (next.unclearFields.length > 0) {
    reasons.push(`Unclear new-prescription fields: ${next.unclearFields.join(', ')}.`);
  }
  if (previous.unclearFields.length > 0) {
    reasons.push(`Unclear previous-prescription fields: ${previous.unclearFields.join(', ')}.`);
  }

  reasons.push(...missingFieldsOnNew(previous, next));
  reasons.push(...timingConflicts(previous, 'Previous prescription'));
  reasons.push(...timingConflicts(next, 'New prescription'));

  return [...new Set(reasons)];
}

/* ────────────────────────────────────────────────────────────────
   Main comparison
   ──────────────────────────────────────────────────────────────── */

function categoryForMatch(diffs: ComparisonFieldDiff[], reviewReasons: string[]): ComparisonCategory {
  if (reviewReasons.length > 0) return 'needs_review';
  return diffs.length > 0 ? 'changed' : 'unchanged';
}

interface MatchResult {
  next: MedicationEntry;
  matchType: MedicineMatchType;
}

export function computePrescriptionComparison(
  previousMeds: MedicationEntry[],
  nextMeds: MedicationEntry[]
): PrescriptionComparisonResult {
  const previous = previousMeds ?? [];
  const next = nextMeds ?? [];

  const previousCounts = nameKeyCounts(previous);
  const nextCounts = nameKeyCounts(next);
  const usedNextIds = new Set<string>();
  const items: ComparedMedicine[] = [];

  for (const previousMed of previous) {
    const previousKey = normalizeMedicineName(previousMed.medicineName);

    let match: MatchResult | null = null;

    if (previousKey) {
      const exact = next.find(
        candidate =>
          !usedNextIds.has(candidate.id) &&
          normalizeMedicineName(candidate.medicineName) === previousKey
      );
      if (exact) match = { next: exact, matchType: 'exact' };
    }

    if (!match && previousKey.length >= 4) {
      let bestScore = 0;
      let bestCandidate: MedicationEntry | null = null;
      for (const candidate of next) {
        if (usedNextIds.has(candidate.id)) continue;
        const candidateKey = normalizeMedicineName(candidate.medicineName);
        if (candidateKey.length < 4) continue;
        const score = nameSimilarity(previousKey, candidateKey);
        if (score > bestScore) {
          bestScore = score;
          bestCandidate = candidate;
        }
      }
      // A high similarity is still not proof of identity: pair it, but
      // always mark it for manual review.
      if (bestCandidate && bestScore >= 0.9) {
        match = { next: bestCandidate, matchType: 'uncertain' };
      }
    }

    if (match) {
      usedNextIds.add(match.next.id);
      const diffs = buildFieldDiffs(previousMed, match.next);
      const reviewReasons = collectReviewReasons(
        previousMed,
        match.next,
        match.matchType,
        (previousCounts.get(previousKey) ?? 0) > 1,
        (nextCounts.get(normalizeMedicineName(match.next.medicineName)) ?? 0) > 1
      );
      items.push({
        id: `cmp-${previousMed.id}-${match.next.id}`,
        category: categoryForMatch(diffs, reviewReasons),
        previous: previousMed,
        next: match.next,
        matchType: match.matchType,
        diffs,
        reviewReasons,
      });
    } else {
      const reviewReasons: string[] = [
        'This medicine is not listed on the new prescription. This is a review notice, not confirmation that the medicine was stopped.',
      ];
      if (isUnreadableName(previousMed.medicineName)) {
        reviewReasons.push('The previous entry was unreadable, so a match may have been missed.');
      }
      if ((previousCounts.get(previousKey) ?? 0) > 1) {
        reviewReasons.push('This medicine name appears more than once in the previous prescription.');
      }
      if (previousMed.unclear) {
        reviewReasons.push('The previous prescription entry was marked as unclear.');
      }
      items.push({
        id: `cmp-removed-${previousMed.id}`,
        category: previousMed.unclear || isUnreadableName(previousMed.medicineName) ? 'needs_review' : 'removed',
        previous: previousMed,
        next: null,
        matchType: 'none',
        diffs: FIELD_SPECS.map(spec => ({
          field: spec.field,
          label: spec.label,
          previousValue: spec.display(previousMed),
          newValue: null,
          changed: Boolean(spec.display(previousMed)),
        })).filter(diff => diff.changed),
        reviewReasons,
      });
    }
  }

  for (const nextMed of next) {
    if (usedNextIds.has(nextMed.id)) continue;
    const nextKey = normalizeMedicineName(nextMed.medicineName);
    const reviewReasons: string[] = [];
    if (isUnreadableName(nextMed.medicineName) || nextMed.unclear) {
      reviewReasons.push('This new medicine entry is unclear and must be verified before use.');
      if (nextMed.unclearFields.length > 0) {
        reviewReasons.push(`Unclear fields: ${nextMed.unclearFields.join(', ')}.`);
      }
    }
    if ((nextCounts.get(nextKey) ?? 0) > 1) {
      reviewReasons.push('This medicine name appears more than once in the new prescription. A possible duplicate entry needs manual checking.');
    }
    items.push({
      id: `cmp-added-${nextMed.id}`,
      category: reviewReasons.length > 0 ? 'needs_review' : 'added',
      previous: null,
      next: nextMed,
      matchType: 'none',
      diffs: [],
      reviewReasons,
    });
  }

  const summary: ComparisonSummary = {
    total: items.length,
    unchanged: items.filter(item => item.category === 'unchanged').length,
    added: items.filter(item => item.category === 'added').length,
    changed: items.filter(item => item.category === 'changed').length,
    removed: items.filter(item => item.category === 'removed').length,
    needsReview: items.filter(item => item.category === 'needs_review').length,
  };

  const warnings: string[] = [];
  const uncertainCount = items.filter(item => item.matchType === 'uncertain').length;
  if (uncertainCount > 0) {
    warnings.push(
      `${uncertainCount} medicine${uncertainCount === 1 ? '' : 's'} were paired by similar spelling. Confirm the identity with a pharmacist before relying on the comparison.`
    );
  }
  if (summary.needsReview > 0) {
    warnings.push(
      `${summary.needsReview} item${summary.needsReview === 1 ? '' : 's'} need manual review because the handwriting, medicine identity, or instructions were unclear.`
    );
  }

  return {
    items,
    summary,
    warnings,
    generatedAt: new Date().toISOString(),
  };
}

/* ────────────────────────────────────────────────────────────────
   Helpers used by pharmacy / cart / dashboard
   ──────────────────────────────────────────────────────────────── */

export function getPrescriptionMedications(prescription: Prescription): MedicationEntry[] {
  return prescription.verified?.medications ?? prescription.extracted?.medications ?? [];
}

export function getLatestComparison(
  comparisons: PrescriptionComparisonRecord[]
): PrescriptionComparisonRecord | null {
  if (!comparisons || comparisons.length === 0) return null;
  return [...comparisons].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
}

export interface UnresolvedMedicineFlag {
  medicineName: string;
  category: ComparisonCategory;
  comparisonId: string;
  previousPrescriptionId: string;
  newPrescriptionId: string;
  reasons: string[];
}

/**
 * Finds a flag for a medicine name. Product names often include a
 * manufacturer or pack description (for example "Metformin (Cipla)"), so an
 * exact normalised match is tried first and then a whole-word containment
 * check. Matching more items for a clarification block is the safe direction:
 * it can pause ordering, but it can never silently order an uncertain match.
 */
export function findUnresolvedFlag(
  flags: Record<string, UnresolvedMedicineFlag>,
  medicineName: string | null | undefined
): UnresolvedMedicineFlag | undefined {
  const key = normalizeMedicineName(medicineName);
  if (!key) return undefined;
  if (flags[key]) return flags[key];

  const keyTokens = key.split(' ').filter(Boolean);
  for (const [flagKey, flag] of Object.entries(flags)) {
    const flagTokens = flagKey.split(' ').filter(Boolean);
    if (flagTokens.length === 0) continue;
    if (flagTokens.every(token => keyTokens.includes(token))) return flag;
  }
  return undefined;
}

/**
 * Returns medicines from a still-unverified comparison that changed or need
 * review. These are flagged in the pharmacy and cart so an uncertain match is
 * never silently ordered. Once the new version is verified/active, the
 * comparison stops flagging the old version's list.
 */
export function getUnresolvedMedicineFlags(
  comparisons: PrescriptionComparisonRecord[],
  prescriptions: Prescription[]
): Record<string, UnresolvedMedicineFlag> {
  const flags: Record<string, UnresolvedMedicineFlag> = {};
  const prescriptionById = new Map(prescriptions.map(rx => [rx.id, rx]));

  const activePrescription = prescriptions.find(rx => rx.status === 'active') ?? null;
  const activeTime = activePrescription
    ? new Date(activePrescription.uploadedAt).getTime()
    : null;

  for (const comparison of comparisons ?? []) {
    const newPrescription = prescriptionById.get(comparison.newPrescriptionId);
    // A verified/active new version is no longer an unresolved draft.
    if (!newPrescription || newPrescription.status === 'active') continue;

    // An old draft that is superseded by a newer verified version must not keep
    // blocking the current active list. Only drafts newer than the active
    // version represent an unresolved change to the current prescription.
    if (
      activeTime !== null &&
      new Date(newPrescription.uploadedAt).getTime() < activeTime
    ) {
      continue;
    }

    for (const item of comparison.result.items) {
      if (item.category !== 'changed' && item.category !== 'needs_review') continue;

      const names = new Set<string>();
      if (item.previous?.medicineName) names.add(item.previous.medicineName);
      if (item.next?.medicineName) names.add(item.next.medicineName);

      for (const name of names) {
        const key = normalizeMedicineName(name);
        if (!key) continue;
        flags[key] = {
          medicineName: name,
          category: item.category,
          comparisonId: comparison.id,
          previousPrescriptionId: comparison.previousPrescriptionId,
          newPrescriptionId: comparison.newPrescriptionId,
          reasons: item.reviewReasons,
        };
      }
    }
  }

  return flags;
}
