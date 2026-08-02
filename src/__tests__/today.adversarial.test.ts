/**
 * Adversarial test suite for today-page utilities.
 * Oracle: the contract spec only. No production source files were read.
 *
 * Targets:
 *   A. getOddsLine band boundaries (off-by-one at 2/3 and 7/8 seams)
 *   B. getOddsLine future dates (must read as today, never as old)
 *   C. getOddsLine bad inputs (null, undefined, "", whitespace, garbage)
 *   D. isSafeUrl (http/https → true; everything else → false)
 *   E. resolveMinScore (0 must survive the falsy || bug; undefined → 30)
 *   F. filterMatches (mutation, ordering, middle removal, double-count)
 *   G. Combined: filter then external cap to five
 */

import { getOddsLine, isSafeUrl } from '../utils/brief-utils';
import { resolveMinScore, filterMatches } from '../utils/today-selection';
import type { JobResult } from '../types/JobResult';
import type { Job } from '../types/Job';

// ── Fixed clock ────────────────────────────────────────────────────────────────
// Pin system time to noon UTC on 2026-08-02.
// Noon eliminates midnight-edge artefacts: a "1 day ago" post never flips to
// "2 days ago" mid-test due to wall-clock drift. This constant is computed from
// a literal ISO string at module load time, before fake timers engage, so
// daysAgo / daysAhead are always consistent with the pinned implementation clock.
const FIXED_NOW_ISO = '2026-08-02T12:00:00.000Z';
const FIXED_NOW = new Date(FIXED_NOW_ISO);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** ISO datetime string exactly N whole days before FIXED_NOW. */
function daysAgo(n: number): string {
  return new Date(FIXED_NOW.getTime() - n * MS_PER_DAY).toISOString();
}

/** ISO datetime string exactly N whole days after FIXED_NOW. */
function daysAhead(n: number): string {
  return new Date(FIXED_NOW.getTime() + n * MS_PER_DAY).toISOString();
}

// ── Fixture builders ───────────────────────────────────────────────────────────
function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    _id: 'job-fixture',
    title: 'Software Engineer',
    company: 'TestCo',
    location: ['Remote'],
    salary: { min: 50000, max: 100000, currency: 'USD', period: 'year' } as any,
    tags: ['typescript'],
    source: 'test',
    description: 'A test job posting',
    createdAt: FIXED_NOW_ISO,
    updatedAt: FIXED_NOW_ISO,
    postedDate: daysAgo(1),
    scrapedDate: FIXED_NOW_ISO,
    url: 'https://example.com/job',
    ...overrides,
  };
}

let _idSeq = 0;
function makeResult(overrides: Partial<JobResult> = {}): JobResult {
  _idSeq++;
  return {
    _id: `result-${_idSeq}`,
    userId: 'user-1',
    jobId: `job-${_idSeq}`,
    matchScore: 80,
    verdict: 'good',
    reasoning: 'test reasoning',
    clicked: false,
    createdAt: FIXED_NOW_ISO,
    updatedAt: FIXED_NOW_ISO,
    skipped: false,
    applied: null,
    job: makeJob({ _id: `job-${_idSeq}` }),
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// A, B, C — getOddsLine
// ══════════════════════════════════════════════════════════════════════════════

describe('getOddsLine — clock pinned to 2026-08-02T12:00:00Z', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  // ── A. Band boundary assertions ─────────────────────────────────────────────

  describe('A. Band boundaries', () => {
    it('day 0 → "early" copy [contract: 0-day band, reader would be early]', () => {
      expect(getOddsLine(daysAgo(0))).toMatch(/early/i);
    });

    it('day 1 → "early" copy [contract: 1-day band, reader would be early]', () => {
      expect(getOddsLine(daysAgo(1))).toMatch(/early/i);
    });

    it('day 2 → "early" copy [contract: 2-day is still the early band]', () => {
      expect(getOddsLine(daysAgo(2))).toMatch(/early/i);
    });

    it('day 2 and day 3 produce DIFFERENT copy [contract: band changes at 2/3 seam]', () => {
      // Catches: implementation uses "> 2" instead of ">= 3", or vice versa.
      expect(getOddsLine(daysAgo(2))).not.toBe(getOddsLine(daysAgo(3)));
    });

    it('day 3 does NOT contain "early" [contract: 3-day band is pile-building, not early]', () => {
      expect(getOddsLine(daysAgo(3))).not.toMatch(/\bearly\b/i);
    });

    it('day 3 → "building" copy [contract: 3-7 day band, applicant pile is building]', () => {
      expect(getOddsLine(daysAgo(3))).toMatch(/building|pile|growing/i);
    });

    it('day 7 → "building" copy [contract: 7-day is still in building band]', () => {
      expect(getOddsLine(daysAgo(7))).toMatch(/building|pile|growing/i);
    });

    it('day 7 does NOT contain "late" [contract: late band starts at 8, not 7]', () => {
      expect(getOddsLine(daysAgo(7))).not.toMatch(/\blate\b/i);
    });

    it('day 7 and day 8 produce DIFFERENT copy [contract: band changes at 7/8 seam]', () => {
      // Catches: implementation uses "> 7" instead of ">= 8", or vice versa.
      expect(getOddsLine(daysAgo(7))).not.toBe(getOddsLine(daysAgo(8)));
    });

    it('day 8 → "late" copy [contract: 8+ day band, late to apply]', () => {
      expect(getOddsLine(daysAgo(8))).toMatch(/late/i);
    });

    it('day 8 does NOT contain "early" [contract: 8-day band is not early]', () => {
      expect(getOddsLine(daysAgo(8))).not.toMatch(/\bearly\b/i);
    });

    it('day 8 does NOT contain "building" [contract: 8-day band is late, not building]', () => {
      expect(getOddsLine(daysAgo(8))).not.toMatch(/building|pile/i);
    });

    it('day 30 → "late" copy [contract: 8+ day band covers much-older posts]', () => {
      expect(getOddsLine(daysAgo(30))).toMatch(/late/i);
    });
  });

  // ── B. Future dates — must be treated as today ───────────────────────────────

  describe('B. Future dates — treated as posted today', () => {
    it('1 day in the future → "early" copy [contract: future treated as today = early band]', () => {
      expect(getOddsLine(daysAhead(1))).toMatch(/early/i);
    });

    it('30 days in the future → "early" copy [contract: future treated as today = early band]', () => {
      expect(getOddsLine(daysAhead(30))).toMatch(/early/i);
    });

    it('future date → no "late" copy [contract: future must never read as old]', () => {
      // If implementation uses Math.abs(-30 days) = 30 days → late band.
      // That recurrence is what the contract explicitly forbids.
      expect(getOddsLine(daysAhead(30))).not.toMatch(/\blate\b/i);
    });

    it('future date → no "building" copy [contract: future = today = early band, not pile-building]', () => {
      // Math.abs on 1 day future = 1 day → still early, but 7 days future via abs → building.
      expect(getOddsLine(daysAhead(7))).not.toMatch(/building|pile/i);
    });

    it('30-day future produces same output as day-0 [contract: future treated as posted today]', () => {
      // Both 0 elapsed and negative elapsed should collapse to the same band.
      expect(getOddsLine(daysAhead(30))).toBe(getOddsLine(daysAgo(0)));
    });
  });

  // ── C. Bad inputs — neutral unknown copy ────────────────────────────────────

  describe('C. Bad / missing dates — must return neutral unknown copy', () => {
    const badCases: [string, string | undefined | null][] = [
      ['null', null],
      ['undefined', undefined],
      ['empty string', ''],
      ['whitespace only', '   '],
      ['non-date string', 'not-a-date'],
      ['out-of-range month/day', '2026-13-45'],
    ];

    for (const [label, input] of badCases) {
      it(`${label} → does not throw [contract: bad input must not throw]`, () => {
        expect(() => getOddsLine(input)).not.toThrow();
      });

      it(`${label} → non-empty string [contract: silence not acceptable, empty string forbidden]`, () => {
        const result = getOddsLine(input);
        expect(typeof result).toBe('string');
        expect(result.trim().length).toBeGreaterThan(0);
      });

      it(`${label} → contains "unknown" indicator [contract: neutral copy must signal unknown date]`, () => {
        const result = getOddsLine(input);
        expect(result).toMatch(/unknown|unavailable|not available|no date|missing/i);
      });

      it(`${label} → does not claim elapsed days [contract: neutral means no timing claim]`, () => {
        const result = getOddsLine(input);
        // A fabricated "3 days ago" for an unknown date would be misleading.
        expect(result).not.toMatch(/\d+\s*day/i);
      });

      it(`${label} → does not claim "early" [contract: neutral means no "you'd be early" claim]`, () => {
        expect(getOddsLine(input)).not.toMatch(/\bearly\b/i);
      });

      it(`${label} → does not claim "late" [contract: neutral means no timing verdict]`, () => {
        expect(getOddsLine(input)).not.toMatch(/\blate\b/i);
      });
    }

    it('null and undefined produce the same neutral copy [contract: both are absent/missing]', () => {
      expect(getOddsLine(null)).toBe(getOddsLine(undefined));
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// D — isSafeUrl
// ══════════════════════════════════════════════════════════════════════════════

describe('isSafeUrl', () => {
  describe('D. Safe schemes (http and https only)', () => {
    it('https://example.com → true [contract: https is safe]', () => {
      expect(isSafeUrl('https://example.com/jobs')).toBe(true);
    });

    it('http://example.com → true [contract: http is safe]', () => {
      expect(isSafeUrl('http://example.com/jobs')).toBe(true);
    });

    it('https with path and query string → true [contract: full https URL is safe]', () => {
      expect(isSafeUrl('https://jobs.example.com/listing?id=123&ref=board')).toBe(true);
    });
  });

  describe('D. Unsafe schemes and malformed inputs', () => {
    it('javascript:alert(1) → false [contract: javascript: is unsafe]', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    });

    it('JAVASCRIPT:alert(1) uppercase → false [contract: case-insensitive scheme rejection]', () => {
      // A naive `startsWith('javascript:')` passes uppercase through — this catches it.
      expect(isSafeUrl('JAVASCRIPT:alert(1)')).toBe(false);
    });

    it('JavaScript:alert(1) mixed-case → false [contract: scheme check is case-insensitive]', () => {
      expect(isSafeUrl('JavaScript:alert(1)')).toBe(false);
    });

    it('data:text/html,<h1>xss</h1> → false [contract: data: is unsafe]', () => {
      expect(isSafeUrl('data:text/html,<h1>xss</h1>')).toBe(false);
    });

    it('file:///etc/passwd → false [contract: file: is unsafe]', () => {
      expect(isSafeUrl('file:///etc/passwd')).toBe(false);
    });

    it('ftp://example.com → false [contract: only http and https are safe]', () => {
      expect(isSafeUrl('ftp://example.com')).toBe(false);
    });

    it('empty string → false [contract: empty string is unsafe]', () => {
      expect(isSafeUrl('')).toBe(false);
    });

    it('whitespace only → false [contract: whitespace is unsafe]', () => {
      expect(isSafeUrl('   ')).toBe(false);
    });

    it('"example.com" without a scheme → false [contract: no scheme ≠ http/https]', () => {
      // Scraped data often omits the scheme; this must not be trusted.
      expect(isSafeUrl('example.com')).toBe(false);
    });

    it('"example.com/path" without scheme → false [contract: implicit scheme not allowed]', () => {
      expect(isSafeUrl('example.com/jobs/123')).toBe(false);
    });

    it('"//evil.com" protocol-relative → false [contract: must have explicit http/https]', () => {
      expect(isSafeUrl('//evil.com/phish')).toBe(false);
    });

    it('unparseable garbage → false [contract: garbage input is unsafe]', () => {
      expect(isSafeUrl('not a url !@#$%^&*()')).toBe(false);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// E — resolveMinScore
// ══════════════════════════════════════════════════════════════════════════════

describe('resolveMinScore', () => {
  describe('E. Numeric inputs pass through unchanged', () => {
    it('0 → 0 [contract: 0 must survive; the || falsy bug already shipped once]', () => {
      // If implementation uses `minScore || 30` instead of `minScore ?? 30`,
      // this returns 30. A deliberate threshold of 0 must not be silently raised.
      expect(resolveMinScore(0)).toBe(0);
    });

    it('1 → 1 [contract: small positive numbers pass through]', () => {
      expect(resolveMinScore(1)).toBe(1);
    });

    it('30 → 30 [contract: explicit 30 passes through unchanged]', () => {
      // The default IS 30; passing 30 explicitly must return 30 (not a no-op that hides bugs).
      expect(resolveMinScore(30)).toBe(30);
    });

    it('100 → 100 [contract: large numbers pass through]', () => {
      expect(resolveMinScore(100)).toBe(100);
    });

    it('-1 → -1 [contract: negative numbers are still numbers and pass through]', () => {
      expect(resolveMinScore(-1)).toBe(-1);
    });
  });

  describe('E. undefined → default 30', () => {
    it('undefined → 30 [contract: undefined is the only case that gets the default]', () => {
      expect(resolveMinScore(undefined)).toBe(30);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// F, G — filterMatches
// ══════════════════════════════════════════════════════════════════════════════

describe('filterMatches', () => {
  describe('F. Removal conditions', () => {
    it('entry with job, clicked=false, skipped=false → kept [contract: only removes disqualified]', () => {
      const entry = makeResult({ clicked: false, skipped: false });
      const result = filterMatches([entry]);
      expect(result).toContain(entry);
      expect(result).toHaveLength(1);
    });

    it('entry with job=null → removed [contract: null job is disqualified]', () => {
      const entry = makeResult({ job: null });
      expect(filterMatches([entry])).toHaveLength(0);
    });

    it('entry with clicked=true → removed [contract: clicked is disqualified]', () => {
      const entry = makeResult({ clicked: true, skipped: false });
      expect(filterMatches([entry])).toHaveLength(0);
    });

    it('entry with skipped=true → removed [contract: skipped is disqualified]', () => {
      const entry = makeResult({ clicked: false, skipped: true });
      expect(filterMatches([entry])).toHaveLength(0);
    });

    it('entry that is both clicked AND skipped → removed exactly once [contract: not double-counted]', () => {
      // If implementation subtracts a removal count twice, a negative or weird length could result.
      const entry = makeResult({ clicked: true, skipped: true });
      const result = filterMatches([entry]);
      expect(result).toHaveLength(0);
    });
  });

  describe('F. Order preservation', () => {
    it('three valid entries return in original order [contract: relative order preserved]', () => {
      const a = makeResult({ matchScore: 90 });
      const b = makeResult({ matchScore: 80 });
      const c = makeResult({ matchScore: 70 });
      const result = filterMatches([a, b, c]);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe(a);
      expect(result[1]).toBe(b);
      expect(result[2]).toBe(c);
    });

    it('disqualified entry in the MIDDLE does not disturb neighbors [contract: order preserved, middle removal]', () => {
      // Catches: splice-while-iterating shifts indices, making `last` drop off.
      const first = makeResult();
      const middle = makeResult({ clicked: true }); // disqualified
      const last = makeResult();
      const result = filterMatches([first, middle, last]);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(first);
      expect(result[1]).toBe(last);
    });

    it('multiple disqualified entries scattered throughout — survivors in correct order', () => {
      const v1 = makeResult();
      const v2 = makeResult();
      const v3 = makeResult();
      const d1 = makeResult({ clicked: true });
      const d2 = makeResult({ job: null });
      const d3 = makeResult({ skipped: true });
      const input = [d1, v1, d2, v2, d3, v3];
      const result = filterMatches(input);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe(v1);
      expect(result[1]).toBe(v2);
      expect(result[2]).toBe(v3);
    });
  });

  describe('F. Input mutation guard', () => {
    it('does not mutate the input array [contract: does not mutate input]', () => {
      const valid = makeResult();
      const disqualified = makeResult({ clicked: true });
      const entries: JobResult[] = [valid, disqualified, valid];
      const originalLength = entries.length;
      const originalFirst = entries[0];
      const originalSecond = entries[1];

      filterMatches(entries);

      expect(entries).toHaveLength(originalLength);
      expect(entries[0]).toBe(originalFirst);
      expect(entries[1]).toBe(originalSecond);
    });

    it('returned array is a new array, not the input reference [contract: does not mutate input]', () => {
      const entries = [makeResult(), makeResult()];
      const result = filterMatches(entries);
      expect(result).not.toBe(entries);
    });
  });

  describe('F. No cap inside filterMatches', () => {
    it('10 valid entries → 10 returned [contract: cap happens elsewhere, not inside filterMatches]', () => {
      const entries = Array.from({ length: 10 }, () => makeResult());
      expect(filterMatches(entries)).toHaveLength(10);
    });

    it('20 valid entries → 20 returned [contract: cap is external, any count of survivors is fine]', () => {
      const entries = Array.from({ length: 20 }, () => makeResult());
      expect(filterMatches(entries)).toHaveLength(20);
    });
  });

  describe('G. Combined: filtering before external cap', () => {
    it('mixed array of 8 valid + 3 disqualified → first 5 survivors are the right 5', () => {
      // Demonstrates that filtering genuinely happens before an external slice(0,5).
      // If filterMatches caps internally, only 5 would survive and the slice would
      // include some wrong entries or miss entries that should be present.
      const valid = Array.from({ length: 8 }, (_, i) =>
        makeResult({ matchScore: 95 - i })
      );
      const disqualified = [
        makeResult({ clicked: true }),
        makeResult({ job: null }),
        makeResult({ skipped: true }),
      ];
      // Disqualified entries are placed in various positions, including the front.
      const mixed: JobResult[] = [
        disqualified[0],
        valid[0],
        valid[1],
        disqualified[1],
        valid[2],
        valid[3],
        disqualified[2],
        valid[4],
        valid[5],
        valid[6],
        valid[7],
      ];

      const filtered = filterMatches(mixed);
      expect(filtered).toHaveLength(8);

      // Simulate the external cap: take first 5.
      const capped = filtered.slice(0, 5);
      expect(capped).toHaveLength(5);

      // The five must be the first five valid entries in original order.
      expect(capped[0]).toBe(valid[0]);
      expect(capped[1]).toBe(valid[1]);
      expect(capped[2]).toBe(valid[2]);
      expect(capped[3]).toBe(valid[3]);
      expect(capped[4]).toBe(valid[4]);

      // And none of the disqualified entries should appear.
      expect(capped.some(r => r.clicked || r.skipped || r.job === null)).toBe(false);
    });

    it('all disqualified: empty input passes through to cap yielding nothing', () => {
      const all = [
        makeResult({ clicked: true }),
        makeResult({ skipped: true }),
        makeResult({ job: null }),
      ];
      const filtered = filterMatches(all);
      expect(filtered).toHaveLength(0);
      expect(filtered.slice(0, 5)).toHaveLength(0);
    });
  });
});
