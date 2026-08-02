import { JobResult } from "@/types/JobResult";

export type TrackerColumn = "applied" | "heard_back" | "interviewing" | "closed";

export const getTrackerColumn = (job: JobResult): TrackerColumn => {
  const outcome = job.applicationOutcome;
  if (!outcome) return "applied";
  if (outcome === "heard_back") return "heard_back";
  if (outcome === "interview") return "interviewing";
  if (outcome === "rejected" || outcome === "no_response" || outcome === "offer") return "closed";
  // Unknown/unexpected outcome value: default to closed (do NOT crash, do NOT drop)
  return "closed";
};

export const getQuietDays = (appliedAt: string | undefined | null): number | null => {
  if (!appliedAt) return null;
  const parsed = new Date(appliedAt);
  if (isNaN(parsed.getTime())) return null;
  const now = new Date();
  // Clamp future dates to today — a future appliedAt yields 0, not a negative number
  const effective = parsed > now ? now : parsed;
  return Math.floor((now.getTime() - effective.getTime()) / (1000 * 60 * 60 * 24));
};

export const shouldShowFollowUp = (job: JobResult): boolean => {
  if (job.applicationOutcome) return false;
  const days = getQuietDays(job.appliedAt);
  return days !== null && days >= 14;
};
