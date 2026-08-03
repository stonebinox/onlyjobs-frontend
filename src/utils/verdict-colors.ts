import { STRONG, LOOK, QUIET } from "@/theme/palette";

export type Verdict = "Strong match" | "Mild match" | "Weak match" | "No match";

type VerdictEntry = {
  hex: string;
  colorScheme: string;
  badgeBg: string;
  badgeText: string;
  gradient: [string, string];
};

export const VERDICT_COLORS: Record<string, VerdictEntry> = {
  "Strong match": { hex: STRONG,  colorScheme: "green",  badgeBg: "#D1FAE5", badgeText: "#145C37", gradient: [STRONG, "#145C37"] },
  "Mild match":   { hex: LOOK,    colorScheme: "yellow", badgeBg: "#FEF3C7", badgeText: "#6B4E15", gradient: [LOOK,   "#6B4E15"] },
  "Weak match":   { hex: QUIET,   colorScheme: "gray",   badgeBg: "#F3F4F6", badgeText: "#4B5563", gradient: [QUIET,  "#4B5563"] },
  "No match":     { hex: QUIET,   colorScheme: "gray",   badgeBg: "#F3F4F6", badgeText: "#4B5563", gradient: [QUIET,  "#4B5563"] },
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
