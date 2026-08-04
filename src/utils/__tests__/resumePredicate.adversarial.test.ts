/**
 * ADVERSARIAL test suite for hasMeaningfulResume.
 *
 * Oracle: the contract spec in the bd task onlyjobs-qiz (not the implementation body).
 * Assume the implementation is subtly wrong; every case is written to EXPOSE bugs.
 *
 * DISCLOSURE: I have not opened resumePredicate.ts or resumePredicate.test.ts.
 * I opened Resume.ts to obtain the type. Incidental observations from that read:
 *   - ExperienceItem is `string | { text: string; link?: string }` — `text` is required in the
 *     type. The contract tests `{ link: "https://x" }` (no `text`). This is a runtime-only case
 *     that requires a cast below; it IS a real production scenario (malformed DB data).
 *   - The Resume type has many extra fields (certifications, languages, projects, achievements,
 *     volunteerExperience, interests). The contract says none of these count. I have NOT
 *     derived expected values from the implementation; all expectations come from the spec.
 * Nothing observed from Resume.ts was used to set an expected value.
 */

import { hasMeaningfulResume } from '@/utils/resumePredicate';
import type { Resume } from '@/types/Resume';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Cast to Partial<Resume> for cases that are intentionally structurally incomplete. */
function r(obj: Partial<Resume>): Partial<Resume> {
  return obj;
}

/** Force-cast for the link-only object case: { link } with no `text` key at all. */
function linkOnly(link: string): unknown {
  return { link };
}

// ---------------------------------------------------------------------------
// Test table
// Each row: [label, input, expected, contractClause]
// ---------------------------------------------------------------------------

type Case = [string, unknown, boolean, string];

export const cases: Case[] = [
  // ---- NULL / UNDEFINED / MISSING ----------------------------------------
  ['null input → false',
    null, false,
    'null/undefined/missing resume returns false'],

  ['undefined input → false',
    undefined, false,
    'null/undefined/missing resume returns false'],

  ['empty object → false',
    {}, false,
    'no counted field present → false'],

  // ---- SUMMARY: whitespace variants --------------------------------------
  ['summary: empty string → false',
    r({ summary: '' }), false,
    'whitespace-only strings are not meaningful'],

  ['summary: single space → false',
    r({ summary: ' ' }), false,
    'whitespace-only strings are not meaningful'],

  ['summary: multiple spaces → false',
    r({ summary: '   ' }), false,
    'whitespace-only strings are not meaningful'],

  ['summary: newline only → false',
    r({ summary: '\n' }), false,
    'whitespace-only strings are not meaningful (\\n is whitespace)'],

  ['summary: tab only → false',
    r({ summary: '\t' }), false,
    'whitespace-only strings are not meaningful (\\t is whitespace)'],

  ['summary: mixed whitespace → false',
    r({ summary: ' \t\n ' }), false,
    'whitespace-only strings are not meaningful'],

  ['summary: real text → true',
    r({ summary: 'Backend engineer' }), true,
    'summary with non-whitespace text → true'],

  ['summary: leading/trailing whitespace around real text → true',
    r({ summary: '  Backend engineer  ' }), true,
    'trim the value; content after trim is non-empty → true'],

  // ---- SKILLS: array cases -----------------------------------------------
  ['skills: empty array → false',
    r({ skills: [] }), false,
    'empty array has no meaningful entries'],

  ['skills: single blank entry → false',
    r({ skills: ['   '] }), false,
    'whitespace-only string in array is not meaningful'],

  ['skills: multiple blank entries → false',
    r({ skills: ['', '\n'] }), false,
    'all array entries blank → false'],

  ['skills: one real entry → true',
    r({ skills: ['React'] }), true,
    'one non-blank skill → true'],

  ['skills: blank + real entry → true',
    r({ skills: ['  ', 'Node'] }), true,
    'one non-blank entry among blanks → true (contract explicit example)'],

  ['skills: tab-only entry among real → true',
    r({ skills: ['\t', 'TypeScript'] }), true,
    'whitespace entries are ignored; real entry wins'],

  // ---- EXPERIENCE: string entries ----------------------------------------
  ['experience: empty array → false',
    r({ experience: [] }), false,
    'empty array has no meaningful entries'],

  ['experience: plain string real entry → true',
    r({ experience: ['Senior dev at X'] }), true,
    'string experience entry with real text → true'],

  ['experience: plain string whitespace only → false',
    r({ experience: ['   '] }), false,
    'whitespace-only plain string is not meaningful'],

  // ---- EXPERIENCE: object entries with text/link -------------------------
  ['experience: object {text:"Lead", link} → true',
    r({ experience: [{ text: 'Lead', link: 'https://x' }] }), true,
    'object entry with non-blank text → true (contract explicit example)'],

  ['experience: object {text:" ", link} → false',
    r({ experience: [{ text: ' ', link: 'https://x' }] }), false,
    'object entry with whitespace-only text + link → false (link alone does not count)'],

  ['experience: object {text:""} → false',
    r({ experience: [{ text: '' }] }), false,
    'object entry with empty text → false'],

  ['experience: object {text:"\\n"} → false',
    r({ experience: [{ text: '\n' }] }), false,
    'object entry with newline-only text → false'],

  // HIGHEST RISK: link-only object — no `text` key at all.
  // The TypeScript type requires `text`, but at runtime malformed data can omit it.
  // Contract: "a link-only entry with no meaningful text does NOT count".
  // An implementation that does `item.text.trim()` without guarding for undefined THROWS here.
  ['experience: object {link only, no text key} → false',
    { experience: [linkOnly('https://x')] }, false,
    'object entry with no text key → false; must not throw on missing text property'],

  // ---- EDUCATION: string entries -----------------------------------------
  ['education: empty array → false',
    r({ education: [] }), false,
    'empty array has no meaningful entries'],

  ['education: newline-only entry → false',
    r({ education: ['\n'] }), false,
    'whitespace-only string in education is not meaningful'],

  ['education: real entry → true',
    r({ education: ['BS CS'] }), true,
    'education with non-blank string → true'],

  // ---- ALL FOUR FIELDS PRESENT BUT ALL BLANK → false ---------------------
  ['all four fields present, all blank → false',
    r({
      summary: '  ',
      skills: [' '],
      experience: [{ text: '' }],
      education: [''],
    }), false,
    'each counted field blank → no meaningful content overall'],

  // ---- ONE MEANINGFUL FIELD AMONG BLANK OTHERS → true -------------------
  ['blank summary + real skill → true',
    r({ summary: '   ', skills: ['React'] }), true,
    'blank summary does not cancel a real skill (contract explicit example)'],

  ['blank skills + real summary → true',
    r({ summary: 'Engineer', skills: [' '] }), true,
    'one meaningful field is enough'],

  ['blank summary + blank skills + real education → true',
    r({ summary: '', skills: [], education: ['BS CS'] }), true,
    'one meaningful field is enough regardless of which one'],

  ['all blank except one meaningful experience object → true',
    r({
      summary: '',
      skills: [''],
      experience: [{ text: 'Lead', link: 'https://x' }],
      education: [''],
    }), true,
    'one meaningful experience object is enough'],

  // ---- FIELDS OUTSIDE THE FOUR COUNTED FIELDS → false -------------------
  // The contract: only summary/skills/experience/education count.
  // Certifications, languages, projects, achievements, interests are irrelevant.

  ['certifications with real text, no counted fields → false',
    r({ certifications: ['AWS Certified'] }), false,
    'certifications are not in the four counted fields'],

  ['languages with real text, no counted fields → false',
    r({ languages: ['English'] }), false,
    'languages are not in the four counted fields'],

  ['projects with real text, no counted fields → false',
    // ProjectItem can be string or {text, link}; cast because Resume.projects expects ProjectItem[]
    ({ projects: ['Big project'] } as unknown as Partial<Resume>), false,
    'projects are not in the four counted fields'],

  ['interests with real text, no counted fields → false',
    r({ interests: ['hiking'] }), false,
    'interests are not in the four counted fields'],

  ['achievements with real text, no counted fields → false',
    r({ achievements: ['Award winner'] }), false,
    'achievements are not in the four counted fields'],

  ['volunteerExperience with real text, no counted fields → false',
    r({ volunteerExperience: ['Food bank'] }), false,
    'volunteerExperience is not in the four counted fields'],

  // ---- EDGE: non-counted fields real + one counted field blank → false ---
  ['certifications real + all four counted fields blank → false',
    r({
      certifications: ['AWS'],
      summary: '',
      skills: [],
      experience: [],
      education: [],
    }), false,
    'non-counted fields do not rescue blank counted fields'],

  // ---- EDGE: experience mix of object and string entries -----------------
  ['experience: blank string then real object → true',
    r({ experience: ['   ', { text: 'Engineer', link: 'https://x' }] }), true,
    'one meaningful entry in mixed array → true'],

  ['experience: real string then link-only object → true',
    { experience: ['Engineer', linkOnly('https://x')] }, true,
    'real string entry saves the array even if another entry is link-only'],

  // ---- EDGE: whitespace around a real value in experience text field -----
  ['experience: object {text:"  Lead  "} → true',
    r({ experience: [{ text: '  Lead  ' }] }), true,
    'text with surrounding whitespace trims to a non-empty value → true'],
];

// ---------------------------------------------------------------------------
// Jest test runner
// ---------------------------------------------------------------------------

describe('hasMeaningfulResume — adversarial contract tests', () => {
  test.each(cases)('%s', (label, input, expected, clause) => {
    const result = hasMeaningfulResume(input as Partial<Resume> | null | undefined);
    if (result !== expected) {
      throw new Error(
        `FINDING — ${label}\n` +
        `  Contract clause: ${clause}\n` +
        `  Input: ${JSON.stringify(input)}\n` +
        `  Expected: ${expected}\n` +
        `  Got:      ${result}`
      );
    }
  });
});
