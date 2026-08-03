export type Verdict = "Strong match" | "Mild match" | "Weak match" | "No match";

type VerdictEntry = {
  hex: string;
  colorScheme: string;
  badgeBg: string;
  badgeText: string;
  gradient: [string, string];
};

export const VERDICT_COLORS: Record<string, VerdictEntry> = {
  "Strong match": { hex: "#22C55E", colorScheme: "green",  badgeBg: "#DCFCE7", badgeText: "#15803D", gradient: ["#22C55E", "#16A34A"] },
  "Mild match":   { hex: "#3B82F6", colorScheme: "blue",   badgeBg: "#DBEAFE", badgeText: "#1D4ED8", gradient: ["#3B82F6", "#2563EB"] },
  "Weak match":   { hex: "#F59E0B", colorScheme: "yellow", badgeBg: "#FEF3C7", badgeText: "#B45309", gradient: ["#F59E0B", "#D97706"] },
  "No match":     { hex: "#6B7280", colorScheme: "gray",   badgeBg: "#F3F4F6", badgeText: "#4B5563", gradient: ["#6B7280", "#4B5563"] },
};

const FALLBACK: VerdictEntry = VERDICT_COLORS["No match"];

export const MATCH_HEX = {
  strong: VERDICT_COLORS["Strong match"].hex,
  mild:   VERDICT_COLORS["Mild match"].hex,
  weak:   VERDICT_COLORS["Weak match"].hex,
  none:   VERDICT_COLORS["No match"].hex,
} as const;

export function getVerdictColor(verdict: string): { hex: string; colorScheme: string } {
  const entry = VERDICT_COLORS[verdict] ?? FALLBACK;
  return { hex: entry.hex, colorScheme: entry.colorScheme };
}

export function getVerdictRing(verdict: string): { hex: string; badgeBg: string; badgeText: string; gradient: [string, string] } {
  const entry = VERDICT_COLORS[verdict] ?? FALLBACK;
  return { hex: entry.hex, badgeBg: entry.badgeBg, badgeText: entry.badgeText, gradient: entry.gradient };
}
