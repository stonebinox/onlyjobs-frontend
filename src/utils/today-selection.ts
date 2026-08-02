import { JobResult } from "@/types/JobResult";

// Returns the minScore value unchanged, using 30 as the default when undefined.
// ?? is deliberate — a stored value of 0 must reach the API as 0, not 30.
export const resolveMinScore = (minScore: number | undefined): number =>
  minScore ?? 30;

// Removes entries with a missing job, already-clicked, or skipped, then sorts by score.
// The caller applies the display cap (slice) after this — filtering must always precede capping.
export const filterMatches = (entries: JobResult[]): JobResult[] =>
  entries
    .filter((e) => e.job !== null && !e.clicked && !e.skipped)
    .sort((a, b) => b.matchScore - a.matchScore);
