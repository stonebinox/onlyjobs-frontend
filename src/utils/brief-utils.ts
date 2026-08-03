// Do NOT use Math.abs — future dates must clamp to today, not read as old.
import { STRONG, LOOK, QUIET } from "@/theme/palette";

export type OddsBucket = "early" | "building" | "late" | "unknown";

// Single source of bucket classification — thresholds live here only.
// Both getOddsLine and getOddsColor derive from this so they can never disagree.
export const getOddsBucket = (postedDate: string | undefined | null): OddsBucket => {
  if (!postedDate) return "unknown";
  const parsed = new Date(postedDate);
  if (isNaN(parsed.getTime())) return "unknown";
  const now = new Date();
  // Clamp: a future-dated posting counts as posted today, not as old.
  const effectiveDate = parsed > now ? now : parsed;
  const diffDays = Math.floor((now.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 2) return "early";
  if (diffDays <= 7) return "building";
  return "late";
};

export const getOddsColor = (postedDate: string | undefined | null): string => {
  const bucket = getOddsBucket(postedDate);
  if (bucket === "early") return STRONG;
  if (bucket === "building") return LOOK;
  return QUIET;
};

export const getOddsLine = (postedDate: string | undefined | null): string => {
  const bucket = getOddsBucket(postedDate);
  if (bucket === "unknown") return "Posting date unknown";

  // diffDays needed for the prefix; parse is safe since bucket !== "unknown"
  const parsed = new Date(postedDate!);
  const now = new Date();
  const effectiveDate = parsed > now ? now : parsed;
  const diffDays = Math.floor((now.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24));

  const suffix =
    bucket === "early" ? "you'd be early" :
    bucket === "building" ? "the pile's building" :
    "late, only if you really want it";

  if (diffDays === 0) return `Posted today — ${suffix}`;
  if (diffDays === 1) return `Posted yesterday — ${suffix}`;
  return `Posted ${diffDays} days ago — ${suffix}`;
};

export const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};
