import { getOddsLine, isSafeUrl } from "@/utils/brief-utils";
import { resolveMinScore, filterMatches } from "@/utils/today-selection";
import { JobResult } from "@/types/JobResult";
import { Job } from "@/types/Job";

const daysAgo = (n: number): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const daysFromNow = (n: number): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  _id: "job-id",
  title: "Engineer",
  company: "Acme",
  location: [],
  salary: null as unknown as Job["salary"],
  tags: [],
  source: "LinkedIn",
  description: "desc",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  postedDate: new Date().toISOString(),
  scrapedDate: new Date().toISOString(),
  url: "https://example.com",
  ...overrides,
});

const makeEntry = (overrides: Partial<JobResult> = {}): JobResult => ({
  _id: "match-id",
  userId: "user-id",
  jobId: "job-id",
  matchScore: 50,
  verdict: "Strong match",
  reasoning: "Good fit",
  clicked: false,
  skipped: false,
  applied: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  job: makeJob(),
  ...overrides,
});

// ── getOddsLine ──────────────────────────────────────────────────────────────

describe("getOddsLine", () => {
  it("today — posted today copy", () => {
    expect(getOddsLine(daysAgo(0))).toBe("Posted today — you'd be early");
  });

  it("1 day ago — posted yesterday copy", () => {
    expect(getOddsLine(daysAgo(1))).toBe("Posted yesterday — you'd be early");
  });

  it("5 days ago — pile-building copy", () => {
    const result = getOddsLine(daysAgo(5));
    expect(result).toContain("5 days ago");
    expect(result).toContain("pile's building");
  });

  it("11 days ago — late copy", () => {
    const result = getOddsLine(daysAgo(11));
    expect(result).toContain("11 days ago");
    expect(result).toContain("late");
  });

  it("future date — clamps to today, not treated as old", () => {
    expect(getOddsLine(daysFromNow(5))).toBe("Posted today — you'd be early");
  });

  it("null — neutral copy, not silence", () => {
    expect(getOddsLine(null)).toBe("Posting date unknown");
  });

  it("undefined — neutral copy, not silence", () => {
    expect(getOddsLine(undefined)).toBe("Posting date unknown");
  });

  it("unparseable string — neutral copy, not silence", () => {
    expect(getOddsLine("not-a-date")).toBe("Posting date unknown");
  });

  it("empty string — neutral copy, not silence", () => {
    expect(getOddsLine("")).toBe("Posting date unknown");
  });
});

// ── isSafeUrl ────────────────────────────────────────────────────────────────

describe("isSafeUrl", () => {
  it("allows https://", () => expect(isSafeUrl("https://example.com")).toBe(true));
  it("allows http://", () => expect(isSafeUrl("http://example.com")).toBe(true));
  it("refuses javascript:", () => expect(isSafeUrl("javascript:alert(1)")).toBe(false));
  it("refuses empty string", () => expect(isSafeUrl("")).toBe(false));
  it("refuses plain garbage", () => expect(isSafeUrl("not-a-url")).toBe(false));
});

// ── resolveMinScore ──────────────────────────────────────────────────────────

describe("resolveMinScore", () => {
  it("passes 0 through as 0, not 30 — ?? not ||", () => {
    expect(resolveMinScore(0)).toBe(0);
  });

  it("uses 30 when undefined", () => {
    expect(resolveMinScore(undefined)).toBe(30);
  });

  it("passes arbitrary values through unchanged", () => {
    expect(resolveMinScore(75)).toBe(75);
  });
});

// ── filterMatches ────────────────────────────────────────────────────────────

describe("filterMatches — filter happens before cap", () => {
  it("removes null-job entries; 6 entries with 1 null-job yields 5 after filter+cap", () => {
    const entries = [
      makeEntry({ _id: "1", matchScore: 90, job: null }),
      makeEntry({ _id: "2", matchScore: 80 }),
      makeEntry({ _id: "3", matchScore: 70 }),
      makeEntry({ _id: "4", matchScore: 60 }),
      makeEntry({ _id: "5", matchScore: 50 }),
      makeEntry({ _id: "6", matchScore: 40 }),
    ];
    const result = filterMatches(entries).slice(0, 5);
    expect(result).toHaveLength(5);
    expect(result.find((e) => e._id === "1")).toBeUndefined();
  });

  it("removes clicked entries; 6 entries with 1 clicked yields 5 after filter+cap", () => {
    const entries = [
      makeEntry({ _id: "1", matchScore: 90, clicked: true }),
      makeEntry({ _id: "2", matchScore: 80 }),
      makeEntry({ _id: "3", matchScore: 70 }),
      makeEntry({ _id: "4", matchScore: 60 }),
      makeEntry({ _id: "5", matchScore: 50 }),
      makeEntry({ _id: "6", matchScore: 40 }),
    ];
    const result = filterMatches(entries).slice(0, 5);
    expect(result).toHaveLength(5);
    expect(result.find((e) => e._id === "1")).toBeUndefined();
  });

  it("removes skipped entries; 6 entries with 1 skipped yields 5 after filter+cap", () => {
    const entries = [
      makeEntry({ _id: "1", matchScore: 90, skipped: true }),
      makeEntry({ _id: "2", matchScore: 80 }),
      makeEntry({ _id: "3", matchScore: 70 }),
      makeEntry({ _id: "4", matchScore: 60 }),
      makeEntry({ _id: "5", matchScore: 50 }),
      makeEntry({ _id: "6", matchScore: 40 }),
    ];
    const result = filterMatches(entries).slice(0, 5);
    expect(result).toHaveLength(5);
    expect(result.find((e) => e._id === "1")).toBeUndefined();
  });

  it("filter-before-cap: if cap ran first on 6 entries with 1 invalid, only 4 would survive — verify we get 5", () => {
    // 6 entries total, highest-scored is invalid. If slice(0,5) ran first, we'd get 4 valid.
    // Correct order (filter then slice) gives 5.
    const entries = [
      makeEntry({ _id: "bad", matchScore: 99, skipped: true }),
      makeEntry({ _id: "a", matchScore: 80 }),
      makeEntry({ _id: "b", matchScore: 70 }),
      makeEntry({ _id: "c", matchScore: 60 }),
      makeEntry({ _id: "d", matchScore: 50 }),
      makeEntry({ _id: "e", matchScore: 40 }),
    ];
    const result = filterMatches(entries).slice(0, 5);
    expect(result).toHaveLength(5);
    expect(result.every((e) => !e.skipped)).toBe(true);
  });
});
