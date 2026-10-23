import { filterMatches, resolveMinScore } from "@/utils/today-selection";
import { resolveDashboardRedirect } from "@/pages/dashboard/index";
import type { JobResult } from "@/types/JobResult";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));
jest.mock("next/router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), query: {} }),
}));

const job = {
  _id: "j", title: "T", company: "C", location: [], salary: { min: 0, max: 0, currency: "USD", estimated: false },
  tags: [], source: "s", description: "", createdAt: "", updatedAt: "", postedDate: "", scrapedDate: "", url: "https://example.com/j",
};

const mk = (id: string, over: Partial<JobResult> = {}): JobResult => ({
  _id: id, userId: "u", jobId: id, matchScore: 50, verdict: "", reasoning: "", clicked: false,
  createdAt: "", updatedAt: "", skipped: false, applied: null, job: { ...job, _id: id }, ...over,
});

describe("U1 filterMatches", () => {
  it("removes ineligible rows and keeps only eligible", () => {
    const input = [
      mk("ok-null"),
      mk("nojob", { job: null }),
      mk("clicked", { clicked: true }),
      mk("skipped", { skipped: true }),
      mk("applied-true", { applied: true }),
      mk("applied-false", { applied: false }),
      mk("ok-undef", { applied: undefined as unknown as null }),
    ];
    const ids = filterMatches(input).map((m) => m._id).sort();
    expect(ids).toEqual(["ok-null", "ok-undef"]);
  });

  it("sorts by matchScore descending, including zero and equal scores", () => {
    const out = filterMatches([
      mk("a", { matchScore: 10 }), mk("b", { matchScore: 0 }), mk("c", { matchScore: 99 }), mk("d", { matchScore: 55 }),
    ]);
    expect(out.map((m) => m._id)).toEqual(["c", "d", "a", "b"]);
  });

  it("does not mutate the input array or its order", () => {
    const input = [mk("a", { matchScore: 1 }), mk("x", { skipped: true }), mk("b", { matchScore: 9 })];
    const snapshot = input.map((m) => m._id);
    const len = input.length;
    filterMatches(input);
    expect(input.map((m) => m._id)).toEqual(snapshot);
    expect(input).toHaveLength(len);
  });

  it("returns empty array for empty input", () => {
    expect(filterMatches([])).toEqual([]);
  });
});

describe("U2 resolveMinScore", () => {
  it("defaults undefined to 30", () => expect(resolveMinScore(undefined)).toBe(30));
  it("keeps 0 as 0 (falsy-zero)", () => expect(resolveMinScore(0)).toBe(0));
  it("keeps other values", () => {
    expect(resolveMinScore(45)).toBe(45);
    expect(resolveMinScore(1)).toBe(1);
    expect(resolveMinScore(100)).toBe(100);
  });
});

describe("U3 resolveDashboardRedirect", () => {
  const cases: Array<[string, string]> = [
    ["?tab=viewed", "/today?view=visited"],
    ["?tab=visited", "/today?view=visited"],
    ["?tab=skipped", "/today?view=skipped"],
    ["?tab=applied", "/tracker"],
    ["?tab=applied&followup=true", "/tracker?followup=true"],
    ["?tab=alljobs", "/browse"],
    ["?tab=matches", "/today"],
    ["", "/today"],
    ["?", "/today"],
  ];
  it.each(cases)("%s -> %s", (search, expected) => {
    expect(resolveDashboardRedirect(search)).toBe(expected);
  });
  it("unknown tab falls back to /today", () => {
    expect(resolveDashboardRedirect("?tab=bogus")).toBe("/today");
  });
  it("followup param order does not matter", () => {
    expect(resolveDashboardRedirect("?followup=true&tab=applied")).toBe("/tracker?followup=true");
  });
  it("followup without applied tab does not leak into other targets", () => {
    expect(resolveDashboardRedirect("?tab=viewed&followup=true")).toBe("/today?view=visited");
  });
});
