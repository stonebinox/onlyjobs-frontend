/**
 * Adversarial tests for @/utils/tracker-utils.
 * Oracle: the contract spec delivered in the test-authorship prompt — no production files read.
 *
 * Forbidden files NOT opened:
 *   - frontend/src/pages/tracker.tsx
 *   - frontend/src/utils/tracker-utils.ts
 *   - backend/src/controllers/matchController.ts
 *   - backend/src/__tests__/tracker.test.ts
 *
 * The OUTCOME_OPTIONS keys were read from FollowUpWizardModal.tsx as permitted.
 */

import { getTrackerColumn, getQuietDays, shouldShowFollowUp } from '@/utils/tracker-utils';
import type { JobResult } from '@/types/JobResult';

// ── Fixed clock ─────────────────────────────────────────────────────────────
// Noon UTC eliminates midnight-edge artefacts (a "13-day" post never flips to
// "14-day" mid-test due to wall-clock drift). Computed from a literal string
// before fake timers engage, so all offset helpers are consistent.
const FIXED_NOW_ISO = '2026-08-03T12:00:00.000Z';
const FIXED_NOW = new Date(FIXED_NOW_ISO);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysAgo(n: number): string {
  return new Date(FIXED_NOW.getTime() - n * MS_PER_DAY).toISOString();
}

function hoursAgo(h: number): string {
  return new Date(FIXED_NOW.getTime() - h * 3600 * 1000).toISOString();
}

function daysAhead(n: number): string {
  return new Date(FIXED_NOW.getTime() + n * MS_PER_DAY).toISOString();
}

// ── Minimal fixture builder ──────────────────────────────────────────────────
let _seq = 0;
function makeResult(overrides: Partial<JobResult> = {}): JobResult {
  _seq++;
  return {
    _id: `r-${_seq}`,
    userId: 'u1',
    jobId: `j-${_seq}`,
    matchScore: 80,
    verdict: 'good',
    reasoning: 'test',
    clicked: false,
    createdAt: FIXED_NOW_ISO,
    updatedAt: FIXED_NOW_ISO,
    skipped: false,
    applied: true,
    job: null,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// A, B, C — getTrackerColumn
// ═══════════════════════════════════════════════════════════════════════════════

describe('getTrackerColumn', () => {
  // ── A. No-outcome → applied column ─────────────────────────────────────────

  describe('A. Falsy/absent applicationOutcome → "applied"', () => {
    it('undefined applicationOutcome → "applied" [contract: falsy outcome = applied]', () => {
      expect(getTrackerColumn(makeResult({ applicationOutcome: undefined }))).toBe('applied');
    });

    it('empty string applicationOutcome → "applied" [contract: empty string is falsy]', () => {
      expect(getTrackerColumn(makeResult({ applicationOutcome: '' }))).toBe('applied');
    });
  });

  // ── B. All five canonical outcome values — pin each explicitly ─────────────

  describe('B. Canonical outcome values — all five must map explicitly', () => {
    it('"heard_back" → "heard_back" [contract: heard_back maps to heard_back column]', () => {
      expect(getTrackerColumn(makeResult({ applicationOutcome: 'heard_back' }))).toBe('heard_back');
    });

    it('"interview" (value) → "interviewing" (column) — the value and column name DIFFER', () => {
      // High-value: a naive switch case returning 'interview' instead of 'interviewing'
      // would silently produce a column that is neither in the board nor a type error.
      const result = getTrackerColumn(makeResult({ applicationOutcome: 'interview' }));
      expect(result).toBe('interviewing');
    });

    it('"interview" → NOT "interview" [contract: column is "interviewing", not "interview"]', () => {
      expect(getTrackerColumn(makeResult({ applicationOutcome: 'interview' }))).not.toBe('interview');
    });

    it('"offer" → "closed" [contract: offer lives in Closed, not a special column]', () => {
      // An impl might create an "offer" column or map offer→interviewing. Both are bugs.
      const result = getTrackerColumn(makeResult({ applicationOutcome: 'offer' }));
      expect(result).toBe('closed');
    });

    it('"offer" → NOT "offer" [contract: no "offer" column exists]', () => {
      expect(getTrackerColumn(makeResult({ applicationOutcome: 'offer' }))).not.toBe('offer');
    });

    it('"offer" → NOT "interviewing" [contract: offer is terminal, not an active interview stage]', () => {
      expect(getTrackerColumn(makeResult({ applicationOutcome: 'offer' }))).not.toBe('interviewing');
    });

    it('"rejected" → "closed" [contract: rejected → closed]', () => {
      expect(getTrackerColumn(makeResult({ applicationOutcome: 'rejected' }))).toBe('closed');
    });

    it('"no_response" → "closed" [contract: no_response → closed]', () => {
      expect(getTrackerColumn(makeResult({ applicationOutcome: 'no_response' }))).toBe('closed');
    });
  });

  // ── C. Unknown outcome values → "closed", no throw ─────────────────────────

  describe('C. Unknown/unexpected outcome → "closed", must not throw', () => {
    it('unknown string → does not throw [contract: unexpected outcome is safe]', () => {
      expect(() =>
        getTrackerColumn(makeResult({ applicationOutcome: 'something_unexpected' }))
      ).not.toThrow();
    });

    it('unknown string → "closed" [contract: fallthrough maps to closed]', () => {
      expect(getTrackerColumn(makeResult({ applicationOutcome: 'something_unexpected' }))).toBe('closed');
    });

    it('numeric-looking string → "closed" [contract: "123" is an unknown outcome]', () => {
      expect(getTrackerColumn(makeResult({ applicationOutcome: '123' }))).toBe('closed');
    });

    it('whitespace string → "closed" [contract: whitespace is not a known outcome]', () => {
      expect(getTrackerColumn(makeResult({ applicationOutcome: '   ' }))).toBe('closed');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// D, E, F — getQuietDays  (clock pinned to FIXED_NOW)
// ═══════════════════════════════════════════════════════════════════════════════

describe('getQuietDays — clock pinned to 2026-08-03T12:00:00Z', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  // ── D. Null / undefined / bad input → null ──────────────────────────────────

  describe('D. Null/undefined/unparseable → null', () => {
    it('null → null [contract: null input returns null]', () => {
      expect(getQuietDays(null)).toBeNull();
    });

    it('undefined → null [contract: undefined input returns null]', () => {
      expect(getQuietDays(undefined)).toBeNull();
    });

    it('empty string → null [contract: empty string is unparseable]', () => {
      expect(getQuietDays('')).toBeNull();
    });

    it('"not-a-date" → null [contract: garbage string is unparseable]', () => {
      expect(getQuietDays('not-a-date')).toBeNull();
    });

    it('"2026-13-45" → null [contract: out-of-range date is unparseable]', () => {
      expect(getQuietDays('2026-13-45')).toBeNull();
    });
  });

  // ── E. Future dates must clamp to 0, NOT become negative or large positive ──

  describe('E. Future appliedAt → 0 (clamped; must NOT be negative or Math.abs-large)', () => {
    it('1 day in the future → 0, NOT -1 [contract: must clamp, not return negative]', () => {
      const result = getQuietDays(daysAhead(1));
      expect(result).toBe(0);
    });

    it('30 days in the future → 0, NOT 30 [contract: Math.abs(-30d)=30 is the bug this catches]', () => {
      // Critical: if impl uses Math.abs, a card applied "tomorrow" would show 30 quiet days.
      // That's the exact failure mode the /today code was written to avoid.
      const result = getQuietDays(daysAhead(30));
      expect(result).not.toBeNull();
      expect(result).toBe(0);
    });

    it('7 days in the future → 0, NOT 7 [contract: any future date clamps to 0]', () => {
      expect(getQuietDays(daysAhead(7))).toBe(0);
    });

    it('future date result is never negative [contract: non-negative when parseable]', () => {
      const result = getQuietDays(daysAhead(3));
      expect(result).not.toBeNull();
      expect(result as number).toBeGreaterThanOrEqual(0);
    });
  });

  // ── F. Known past offsets — floor, not round or ceil ───────────────────────

  describe('F. Past dates — exact floor of elapsed days', () => {
    it('just now (FIXED_NOW) → 0 [contract: same-instant application]', () => {
      expect(getQuietDays(FIXED_NOW_ISO)).toBe(0);
    });

    it('exactly 1 day ago → 1 [contract: single full day]', () => {
      expect(getQuietDays(daysAgo(1))).toBe(1);
    });

    it('13 days 23 hours ago → 13, NOT 14 [contract: floor, not ceil; 13.958 → 13]', () => {
      // If impl rounds or ceils, this returns 14 — matching the cron threshold — making
      // shouldShowFollowUp return true one day early. The email has NOT fired yet at 13 days.
      const result = getQuietDays(hoursAgo(13 * 24 + 23));
      expect(result).toBe(13);
    });

    it('exactly 14 days ago → 14 [contract: the threshold boundary]', () => {
      expect(getQuietDays(daysAgo(14))).toBe(14);
    });

    it('exactly 15 days ago → 15 [contract: old records tracked correctly]', () => {
      expect(getQuietDays(daysAgo(15))).toBe(15);
    });

    it('exactly 30 days ago → 30 [contract: long-stale records]', () => {
      expect(getQuietDays(daysAgo(30))).toBe(30);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// G, H, I — shouldShowFollowUp  (clock pinned to FIXED_NOW)
// ═══════════════════════════════════════════════════════════════════════════════

describe('shouldShowFollowUp — clock pinned to 2026-08-03T12:00:00Z', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  // ── G. applicationOutcome present → always false ────────────────────────────

  describe('G. applicationOutcome present → false regardless of age', () => {
    const OUTCOMES = ['heard_back', 'no_response', 'rejected', 'interview', 'offer'] as const;

    for (const outcome of OUTCOMES) {
      it(`outcome "${outcome}" + 30 quiet days → false [contract: outcome wins over age]`, () => {
        expect(
          shouldShowFollowUp(makeResult({ applicationOutcome: outcome, appliedAt: daysAgo(30) }))
        ).toBe(false);
      });

      it(`outcome "${outcome}" with no appliedAt → false [contract: outcome present always false]`, () => {
        expect(
          shouldShowFollowUp(makeResult({ applicationOutcome: outcome, appliedAt: undefined }))
        ).toBe(false);
      });
    }
  });

  // ── H. Boundary: exactly 14 days (must align with cron threshold) ───────────

  describe('H. Boundary at 14 days — must match the background cron threshold exactly', () => {
    it('no outcome, 13 days → false [contract: 13 < 14; UI must NOT lie before the email fires]', () => {
      // CRITICAL: if impl uses >= 13 instead of >= 14, this returns true and the card
      // claims "follow up?" one day before the email would actually fire.
      expect(shouldShowFollowUp(makeResult({ appliedAt: daysAgo(13) }))).toBe(false);
    });

    it('no outcome, exactly 14 days → true [contract: 14 >= 14, threshold met]', () => {
      // If impl uses > 14 (strict), this returns false — off-by-one.
      expect(shouldShowFollowUp(makeResult({ appliedAt: daysAgo(14) }))).toBe(true);
    });

    it('no outcome, 15 days → true [contract: above threshold]', () => {
      expect(shouldShowFollowUp(makeResult({ appliedAt: daysAgo(15) }))).toBe(true);
    });

    it('no outcome, 30 days → true [contract: long-stale jobs also get nudge]', () => {
      expect(shouldShowFollowUp(makeResult({ appliedAt: daysAgo(30) }))).toBe(true);
    });

    it('no outcome, 13d 23h → false [contract: floor(13.958)=13; pre-threshold floor must not round up]', () => {
      // Catches: getQuietDays rounding/ceiling 13.958 to 14, making shouldShowFollowUp true too early.
      expect(shouldShowFollowUp(makeResult({ appliedAt: hoursAgo(13 * 24 + 23) }))).toBe(false);
    });

    it('no outcome, 14d 1h → true [contract: just over threshold]', () => {
      expect(shouldShowFollowUp(makeResult({ appliedAt: hoursAgo(14 * 24 + 1) }))).toBe(true);
    });
  });

  // ── I. No outcome + recent / missing / future appliedAt → false ─────────────

  describe('I. No outcome + recent/missing date → false', () => {
    it('no outcome, 0 days (just applied) → false [contract: not yet stale]', () => {
      expect(shouldShowFollowUp(makeResult({ appliedAt: FIXED_NOW_ISO }))).toBe(false);
    });

    it('no outcome, future appliedAt → false [contract: clamped to 0 days → below threshold]', () => {
      expect(shouldShowFollowUp(makeResult({ appliedAt: daysAhead(5) }))).toBe(false);
    });

    it('no outcome, undefined appliedAt → false [contract: null quietDays → no nudge]', () => {
      expect(shouldShowFollowUp(makeResult({ appliedAt: undefined }))).toBe(false);
    });

    it('no outcome, "not-a-date" appliedAt → false [contract: bad date → null quietDays → false]', () => {
      expect(shouldShowFollowUp(makeResult({ appliedAt: 'not-a-date' }))).toBe(false);
    });

    it('no outcome, 1 day → false [contract: 1 < 14]', () => {
      expect(shouldShowFollowUp(makeResult({ appliedAt: daysAgo(1) }))).toBe(false);
    });

    it('no outcome, 7 days → false [contract: 7 < 14]', () => {
      expect(shouldShowFollowUp(makeResult({ appliedAt: daysAgo(7) }))).toBe(false);
    });
  });
});
