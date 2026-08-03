import { getOddsBucket, getOddsColor, getOddsLine } from "../brief-utils";
import { STRONG, LOOK, QUIET } from "@/theme/palette";

// ── helpers ───────────────────────────────────────────────────────────────────

const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const daysFromNow = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

// ── getOddsBucket ─────────────────────────────────────────────────────────────

describe("getOddsBucket — boundaries", () => {
  it("0 days ago → early", () => expect(getOddsBucket(daysAgo(0))).toBe("early"));
  it("1 day ago → early", () => expect(getOddsBucket(daysAgo(1))).toBe("early"));
  it("2 days ago → early", () => expect(getOddsBucket(daysAgo(2))).toBe("early"));
  it("3 days ago → building", () => expect(getOddsBucket(daysAgo(3))).toBe("building"));
  it("7 days ago → building", () => expect(getOddsBucket(daysAgo(7))).toBe("building"));
  it("8 days ago → late", () => expect(getOddsBucket(daysAgo(8))).toBe("late"));
  it("15 days ago → late", () => expect(getOddsBucket(daysAgo(15))).toBe("late"));
});

describe("getOddsBucket — future date clamp (must be early, not old)", () => {
  it("1 day ahead → early (clamps to today)", () => expect(getOddsBucket(daysFromNow(1))).toBe("early"));
  it("30 days ahead → early (clamps to today)", () => expect(getOddsBucket(daysFromNow(30))).toBe("early"));
  it("future clamp is identical to today", () =>
    expect(getOddsBucket(daysFromNow(30))).toBe(getOddsBucket(daysAgo(0))));
});

describe("getOddsBucket — bad inputs → unknown", () => {
  it("undefined → unknown", () => expect(getOddsBucket(undefined)).toBe("unknown"));
  it("null → unknown", () => expect(getOddsBucket(null)).toBe("unknown"));
  it("empty string → unknown", () => expect(getOddsBucket("")).toBe("unknown"));
  it("garbage string → unknown", () => expect(getOddsBucket("bad-date")).toBe("unknown"));
});

describe("getOddsBucket — seam precision (off-by-one guards)", () => {
  it("2/3 seam: day 2 is early, day 3 is building", () =>
    expect(getOddsBucket(daysAgo(2))).not.toBe(getOddsBucket(daysAgo(3))));
  it("7/8 seam: day 7 is building, day 8 is late", () =>
    expect(getOddsBucket(daysAgo(7))).not.toBe(getOddsBucket(daysAgo(8))));
});

// ── getOddsColor ──────────────────────────────────────────────────────────────

describe("getOddsColor — palette mapping", () => {
  it("early → STRONG (#1B7A4B)", () => expect(getOddsColor(daysAgo(0))).toBe(STRONG));
  it("early (2d) → STRONG", () => expect(getOddsColor(daysAgo(2))).toBe(STRONG));
  it("building (3d) → LOOK (#8A6D1F)", () => expect(getOddsColor(daysAgo(3))).toBe(LOOK));
  it("building (7d) → LOOK", () => expect(getOddsColor(daysAgo(7))).toBe(LOOK));
  it("late (8d) → QUIET (#6B7280)", () => expect(getOddsColor(daysAgo(8))).toBe(QUIET));
  it("late (30d) → QUIET", () => expect(getOddsColor(daysAgo(30))).toBe(QUIET));
  it("unknown → QUIET", () => expect(getOddsColor(undefined)).toBe(QUIET));
  it("null → QUIET", () => expect(getOddsColor(null)).toBe(QUIET));
  it("bad date → QUIET", () => expect(getOddsColor("not-a-date")).toBe(QUIET));
});

describe("getOddsColor — hex literal contract", () => {
  it("STRONG is #1B7A4B", () => expect(STRONG).toBe("#1B7A4B"));
  it("LOOK is #8A6D1F", () => expect(LOOK).toBe("#8A6D1F"));
  it("QUIET is #6B7280", () => expect(QUIET).toBe("#6B7280"));
});

// ── agreement guard: getOddsLine text must agree with getOddsColor bucket ─────

describe("agreement guard — getOddsLine text and getOddsColor bucket never disagree", () => {
  const cases: Array<{ label: string; days: number; expectedBucket: "early" | "building" | "late" }> = [
    { label: "0 days", days: 0, expectedBucket: "early" },
    { label: "5 days", days: 5, expectedBucket: "building" },
    { label: "20 days", days: 20, expectedBucket: "late" },
  ];

  for (const { label, days, expectedBucket } of cases) {
    it(`${label}: text matches color bucket (${expectedBucket})`, () => {
      const date = daysAgo(days);
      const bucket = getOddsBucket(date);
      const text = getOddsLine(date);
      const color = getOddsColor(date);

      expect(bucket).toBe(expectedBucket);

      if (bucket === "early") {
        expect(text).toMatch(/early/i);
        expect(color).toBe(STRONG);
      } else if (bucket === "building") {
        expect(text).toMatch(/building|pile/i);
        expect(color).toBe(LOOK);
      } else {
        expect(text).toMatch(/late/i);
        expect(color).toBe(QUIET);
      }
    });
  }

  it("unknown: text is 'Posting date unknown', color is QUIET", () => {
    expect(getOddsLine(undefined)).toBe("Posting date unknown");
    expect(getOddsColor(undefined)).toBe(QUIET);
  });
});
