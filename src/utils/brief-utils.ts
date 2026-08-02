// Do NOT use Math.abs in getOddsLine — future dates must clamp to today, not read as old.

// Returns neutral copy for a missing or unparseable date; returns odds copy otherwise.
export const getOddsLine = (postedDate: string | undefined | null): string => {
  // Missing or unparseable: show neutral copy so the reader knows the signal is absent,
  // not silently hidden.
  if (!postedDate) return "Posting date unknown";
  const parsed = new Date(postedDate);
  if (isNaN(parsed.getTime())) return "Posting date unknown";

  const now = new Date();
  // Clamp: a future-dated posting counts as posted today, not as old.
  const effectiveDate = parsed > now ? now : parsed;
  const diffMs = now.getTime() - effectiveDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Posted today — you'd be early";
  if (diffDays === 1) return "Posted yesterday — you'd be early";
  if (diffDays <= 2) return `Posted ${diffDays} days ago — you'd be early`;
  if (diffDays <= 7) return `Posted ${diffDays} days ago — the pile's building`;
  return `Posted ${diffDays} days ago — late, only if you really want it`;
};

export const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};
