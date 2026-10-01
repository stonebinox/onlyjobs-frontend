/**
 * ADVERSARIAL TEST — onlyjobs-24g.9: llms.txt + robots.txt restructure
 *
 * Assume the implementation is SUBTLY WRONG; write tests that EXPOSE bugs.
 * Report pass/fail — failures are FINDINGS. Do NOT fix production code,
 * do NOT weaken assertions.
 *
 * KEY ADVERSARIAL PROPERTY — GROUP-AWARE robots.txt parsing:
 * A naive "string appears somewhere" check false-passes if GPTBot appears in
 * the allow section OR OAI-SearchBot appears in the block section. This test
 * splits on blank lines, builds per-group agent+rule lists, and checks each
 * bot is in the correct group type. The cross-contamination tests specifically
 * catch mis-placement that a substring search cannot detect.
 *
 * Oracle: the bd task spec, never implementation output.
 *
 * DISCLOSURE: see bottom of file.
 */

import fs from 'fs';
import path from 'path';

const ROBOTS_PATH = path.resolve(__dirname, '..', '..', 'public', 'robots.txt');
const LLMS_PATH = path.resolve(__dirname, '..', '..', 'public', 'llms.txt');

// ─── Robots group parser ──────────────────────────────────────────────────────
//
// A robots.txt group is a blank-line-separated block of User-agent lines plus
// rule lines (Allow:, Disallow:, etc.). Comments (#) are stripped — they have
// no semantic effect and may appear anywhere within a group.
//
// ADVERSARIAL NOTE: trim() on each line handles CRLF line endings; a file with
// \r\n would leave '\r' on split('\n'), making 'Disallow: /\r' != 'Disallow: /'.

interface RobotsGroup {
  agents: string[];
  rules: string[];
}

function parseRobots(content: string): RobotsGroup[] {
  // FIX 3: normalize CRLF and bare CR before splitting on blank lines, so a
  // CRLF-formatted robots.txt produces correct groups (not one giant unparsed blob).
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawGroups = normalized.split(/\n[ \t]*\n/).map(g => g.trim()).filter(Boolean);

  return rawGroups.map(group => {
    const lines = group
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'));

    const agents: string[] = [];
    const rules: string[] = [];

    for (const line of lines) {
      if (/^user-agent:/i.test(line)) {
        agents.push(line.replace(/^user-agent:\s*/i, ''));
      } else {
        rules.push(line);
      }
    }

    return { agents, rules };
  });
}

function hasRule(group: RobotsGroup, rule: string): boolean {
  return group.rules.some(r => r.toLowerCase() === rule.toLowerCase());
}

function findGroupForAgent(groups: RobotsGroup[], agent: string): RobotsGroup | undefined {
  return groups.find(g => g.agents.includes(agent));
}

// ─── Constants (from spec) ────────────────────────────────────────────────────

const AUTH_DISALLOWS = [
  '/dashboard',
  '/profile',
  '/wallet',
  '/settings',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/today',
  '/tracker',
  '/browse',
  '/onboarding',
] as const;

const ALLOW_BOTS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'Claude-User',
  'Claude-SearchBot',
] as const;

const BLOCK_BOTS = [
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'Applebot-Extended',
  'Bytespider',
  'Meta-ExternalAgent',
  'CCBot',
  'Cohere-AI',
] as const;

// ─── robots.txt tests ─────────────────────────────────────────────────────────

describe('robots.txt — group-aware parsing', () => {
  let robotsContent: string;
  let groups: RobotsGroup[];

  beforeAll(() => {
    if (!fs.existsSync(ROBOTS_PATH)) {
      throw new Error(`FINDING: robots.txt not found at ${ROBOTS_PATH}. File must exist in public/.`);
    }
    robotsContent = fs.readFileSync(ROBOTS_PATH, 'utf-8');
    groups = parseRobots(robotsContent);
  });

  // ─── User-agent: * group ─────────────────────────────────────────────────

  describe('User-agent: * group', () => {
    let starGroup: RobotsGroup | undefined;

    beforeAll(() => {
      starGroup = findGroupForAgent(groups, '*');
    });

    it('exists (User-agent: * group found in parsed output)', () => {
      if (!starGroup) {
        throw new Error('FINDING: No User-agent: * group found in robots.txt.');
      }
      expect(starGroup).toBeDefined();
    });

    it('has Allow: /', () => {
      expect(starGroup).toBeDefined();
      expect(hasRule(starGroup!, 'Allow: /')).toBe(true);
    });

    for (const p of AUTH_DISALLOWS) {
      it(`has Disallow: ${p}`, () => {
        expect(starGroup).toBeDefined();
        expect(hasRule(starGroup!, `Disallow: ${p}`)).toBe(true);
      });
    }
  });

  // ─── Search / citation bots (allow group) ────────────────────────────────
  //
  // ADVERSARIAL: each bot must be in a group with Allow: / AND all 11 auth
  // disallows, and must NOT be in a group that has the blanket Disallow: /.
  // The "NOT Disallow: /" test catches accidental mis-placement in the block
  // section — a substring search would miss this because 'OAI-SearchBot'
  // could appear elsewhere in the file.

  describe('Search/citation bots: each in an allow group (not the block group)', () => {
    for (const bot of ALLOW_BOTS) {
      describe(`User-agent: ${bot}`, () => {
        let botGroup: RobotsGroup | undefined;

        beforeAll(() => {
          botGroup = findGroupForAgent(groups, bot);
        });

        it('has a dedicated group in robots.txt', () => {
          if (!botGroup) {
            throw new Error(`FINDING: No group found for User-agent: ${bot}.`);
          }
          expect(botGroup).toBeDefined();
        });

        it('group has Allow: /', () => {
          expect(botGroup).toBeDefined();
          expect(hasRule(botGroup!, 'Allow: /')).toBe(true);
        });

        it('group does NOT have Disallow: / (the blanket block — would block all content)', () => {
          // ADVERSARIAL: if this bot were accidentally in the GPTBot block group,
          // this test fails. A naive substring check would not catch this.
          expect(botGroup).toBeDefined();
          expect(hasRule(botGroup!, 'Disallow: /')).toBe(false);
        });

        for (const p of AUTH_DISALLOWS) {
          it(`group has Disallow: ${p}`, () => {
            expect(botGroup).toBeDefined();
            expect(hasRule(botGroup!, `Disallow: ${p}`)).toBe(true);
          });
        }
      });
    }
  });

  // ─── Training crawlers (block group) ─────────────────────────────────────
  //
  // ADVERSARIAL: each bot must be in a group with Disallow: / (block all),
  // and must NOT be in a group that has Allow: /.

  describe('Training crawlers: each in a block group', () => {
    for (const bot of BLOCK_BOTS) {
      describe(`User-agent: ${bot}`, () => {
        let botGroup: RobotsGroup | undefined;

        beforeAll(() => {
          botGroup = findGroupForAgent(groups, bot);
        });

        it('has a dedicated group in robots.txt', () => {
          if (!botGroup) {
            throw new Error(`FINDING: No group found for User-agent: ${bot}.`);
          }
          expect(botGroup).toBeDefined();
        });

        it('group has Disallow: / (block all content)', () => {
          expect(botGroup).toBeDefined();
          expect(hasRule(botGroup!, 'Disallow: /')).toBe(true);
        });

        it('group has NO Allow: directive of any kind (any Allow: line is a failure)', () => {
          // ADVERSARIAL: old check only rejected exact "Allow: /". A block-bot group
          // with "Allow: /public" would have passed. Any Allow: prefix is a mis-placement.
          expect(botGroup).toBeDefined();
          const hasAnyAllow = botGroup!.rules.some(r => /^allow:/i.test(r));
          if (hasAnyAllow) {
            const allowLines = botGroup!.rules.filter(r => /^allow:/i.test(r));
            throw new Error(
              `FINDING: Block-bot "${bot}" group contains Allow: directive(s): ` +
              `${allowLines.join(', ')}. Block groups must contain only Disallow: / — no Allow: lines.`
            );
          }
          expect(hasAnyAllow).toBe(false);
        });
      });
    }
  });

  // ─── Cross-contamination guards ───────────────────────────────────────────
  //
  // These tests verify group membership is mutually exclusive. A naive string
  // search cannot detect a bot that appears in both sections.

  it('no ALLOW-bot is placed in a group with Disallow: / (the block rule)', () => {
    for (const bot of ALLOW_BOTS) {
      const group = findGroupForAgent(groups, bot);
      if (!group) {
        throw new Error(`FINDING: No group found for allow-bot ${bot}.`);
      }
      if (hasRule(group, 'Disallow: /')) {
        throw new Error(
          `FINDING: Allow-bot "${bot}" is in a group with Disallow: / (blanket block). ` +
          'It must be in a group with Allow: / and the 11 specific auth disallows.'
        );
      }
      expect(hasRule(group, 'Disallow: /')).toBe(false);
    }
  });

  it('no BLOCK-bot is placed in a group with any Allow: directive', () => {
    // ADVERSARIAL: tightened to catch Allow: /public, Allow: /static, etc.
    // Any Allow: line in a block-bot group is a mis-placement.
    for (const bot of BLOCK_BOTS) {
      const group = findGroupForAgent(groups, bot);
      if (!group) {
        throw new Error(`FINDING: No group found for block-bot ${bot}.`);
      }
      const hasAnyAllow = group.rules.some(r => /^allow:/i.test(r));
      if (hasAnyAllow) {
        const allowLines = group.rules.filter(r => /^allow:/i.test(r));
        throw new Error(
          `FINDING: Block-bot "${bot}" is in a group with Allow: directive(s): ` +
          `${allowLines.join(', ')}. Block groups must contain only Disallow: /.`
        );
      }
      expect(hasAnyAllow).toBe(false);
    }
  });

  // ─── Uniqueness guards ────────────────────────────────────────────────────
  //
  // ADVERSARIAL: findGroupForAgent() returns only the FIRST matching group. A
  // bot duplicated into both a correct and an incorrect group would pass every
  // per-group check because only the first group is ever examined. These tests
  // count occurrences across ALL groups and require exactly 1.

  describe('Each bot appears in exactly one group (duplicate-group evasion)', () => {
    for (const bot of [...ALLOW_BOTS, ...BLOCK_BOTS]) {
      it(`User-agent: ${bot} appears in exactly 1 group`, () => {
        const count = groups.filter(g => g.agents.includes(bot)).length;
        if (count !== 1) {
          throw new Error(
            `FINDING: "${bot}" appears in ${count} group(s). ` +
            'Each bot must appear in exactly one User-agent group — duplicates allow ' +
            'a mis-placed entry in a second group to evade per-group checks.'
          );
        }
        expect(count).toBe(1);
      });
    }
  });

  // ─── Sitemap ──────────────────────────────────────────────────────────────

  it('contains Sitemap: https://onlyjobs.app/sitemap.xml', () => {
    expect(robotsContent).toContain('Sitemap: https://onlyjobs.app/sitemap.xml');
  });
});

// ─── CRLF normalization — fault-detecting synthetic test ─────────────────────
//
// ADVERSARIAL: passes a synthetic CRLF-formatted robots string into parseRobots
// and asserts two separate groups are produced with the correct agents and rules.
// Removing the replace(/\r\n/g, '\n') from parseRobots causes split(/\n[ \t]*\n/)
// to miss the \n\r\n blank-line boundary, collapsing both groups into one blob —
// this test FAILS under that regression.

describe('parseRobots — CRLF normalization (synthetic, fault-detecting)', () => {
  it('two CRLF groups parse into 2 groups with correct agents and rules', () => {
    const input = 'User-agent: *\r\nAllow: /\r\n\r\nUser-agent: GPTBot\r\nDisallow: /\r\n';
    const groups = parseRobots(input);

    expect(groups).toHaveLength(2);
    expect(groups[0].agents).toContain('*');
    expect(hasRule(groups[0], 'Allow: /')).toBe(true);
    expect(groups[1].agents).toContain('GPTBot');
    expect(hasRule(groups[1], 'Disallow: /')).toBe(true);
  });
});

// ─── llms.txt tests ──────────────────────────────────────────────────────────

describe('llms.txt content', () => {
  let llmsContent: string;

  beforeAll(() => {
    if (!fs.existsSync(LLMS_PATH)) {
      throw new Error(`FINDING: llms.txt not found at ${LLMS_PATH}. File must exist in public/.`);
    }
    llmsContent = fs.readFileSync(LLMS_PATH, 'utf-8');
  });

  // ─── Required sections ────────────────────────────────────────────────────

  describe('Required sections present', () => {
    const REQUIRED_SECTIONS = [
      '## What it is',
      '## How it works',
      '## Pricing',
      '## Definitions',
      '## Key pages',
      '## Citation Format for AI Systems',
    ] as const;

    for (const section of REQUIRED_SECTIONS) {
      it(`contains section heading "${section}"`, () => {
        if (!llmsContent.includes(section)) {
          throw new Error(`FINDING: section "${section}" is absent from llms.txt.`);
        }
        expect(llmsContent).toContain(section);
      });
    }
  });

  // ─── Pricing accuracy ─────────────────────────────────────────────────────

  describe('Pricing accuracy', () => {
    it('contains "$2"', () => {
      expect(llmsContent).toContain('$2');
    });

    it('contains "$0.30"', () => {
      expect(llmsContent).toContain('$0.30');
    });

    it('contains "No subscription" (case-insensitive)', () => {
      expect(llmsContent.toLowerCase()).toContain('no subscription');
    });

    it('contains "threshold"', () => {
      expect(llmsContent).toContain('threshold');
    });

    it('every $ amount in the file is in the allowed set {$0, $2, $0.30, $5, $10, $20}', () => {
      // ADVERSARIAL: catches spurious amounts not in the spec (e.g., $1, $100, $0.20).
      const ALLOWED = new Set(['0', '2', '0.30', '5', '10', '20']);
      const matches = Array.from(llmsContent.matchAll(/\$(\d+(?:\.\d+)?)/g));
      const invalid = matches.map(m => m[1]).filter(amt => !ALLOWED.has(amt));
      if (invalid.length > 0) {
        throw new Error(
          `FINDING: unexpected $ amounts in llms.txt: ${invalid.map(a => '$' + a).join(', ')}. ` +
          'Allowed amounts: $0, $2, $0.30, $5, $10, $20.'
        );
      }
      expect(invalid).toHaveLength(0);
    });
  });

  // ─── Key-page URLs present ────────────────────────────────────────────────

  describe('Key-page URLs present', () => {
    const KEY_URLS = [
      'https://onlyjobs.app/',
      '/sample-match-report',
      '/how-it-works',
      '/about',
      '/ai-job-tools',
      '/blog',
      '/blog/applied-to-hundreds-of-jobs',
      '/blog/job-search-burnout',
    ] as const;

    for (const url of KEY_URLS) {
      it(`contains "${url}"`, () => {
        if (!llmsContent.includes(url)) {
          throw new Error(`FINDING: key-page URL "${url}" is absent from llms.txt.`);
        }
        expect(llmsContent).toContain(url);
      });
    }
  });

  // ─── Forbidden content ────────────────────────────────────────────────────

  describe('Forbidden content absent', () => {
    it('contains no em-dash (U+2014) or en-dash (U+2013) — hyphens only', () => {
      // ADVERSARIAL: the spec forbids dashes; only ASCII hyphens are allowed.
      const matches = llmsContent.match(/[—–]/g);
      if (matches) {
        throw new Error(
          `FINDING: ${matches.length} em/en-dash character(s) found in llms.txt. ` +
          'Replace with hyphens (-).'
        );
      }
      expect(matches).toBeNull();
    });

    it('contains no competitor name "jobright" (case-insensitive)', () => {
      expect(llmsContent).not.toMatch(/\bjobright\b/i);
    });

    it('contains no "jack and jill" (case-insensitive)', () => {
      expect(llmsContent.toLowerCase()).not.toContain('jack and jill');
    });

    it('contains no "tinker tailor" (case-insensitive)', () => {
      expect(llmsContent.toLowerCase()).not.toContain('tinker tailor');
    });

    it('contains no digit product count (e.g. "1000 jobs", "50 users")', () => {
      // ADVERSARIAL: digit-prefixed counts are banned. Must NOT false-positive on:
      //   "three jobs" (spelled out), "60-second" (hyphenated, no space before noun),
      //   blog titles containing the word "jobs" without a preceding digit count.
      // The pattern requires digit(s) + whitespace + the word — "60-second" has no
      // whitespace between "60" and "second", and "three" is not a digit. Safe.
      const countMatch = llmsContent.match(/\d[\d,]*\s+(jobs|users|seekers|listings|sources)/i);
      if (countMatch) {
        throw new Error(
          `FINDING: digit product count found in llms.txt: "${countMatch[0]}". ` +
          'Use spelled-out numbers or remove the count entirely.'
        );
      }
      expect(countMatch).toBeNull();
    });

    it('contains no http(s) URL with a host other than onlyjobs.app or www.linkedin.com', () => {
      // ADVERSARIAL: catches accidental external links (CDN refs, tracking pixels, etc.).
      // Extracts the hostname from every http(s):// URL in the file.
      const urlMatches = Array.from(llmsContent.matchAll(/https?:\/\/([^/\s)\]]+)/g));
      const invalidHosts = urlMatches
        .map(m => m[1])
        .filter(host => host !== 'onlyjobs.app' && host !== 'www.linkedin.com');
      if (invalidHosts.length > 0) {
        throw new Error(
          `FINDING: unexpected external host(s) in llms.txt: ${invalidHosts.join(', ')}. ` +
          'Only onlyjobs.app and www.linkedin.com are allowed.'
        );
      }
      expect(invalidHosts).toHaveLength(0);
    });
  });

  // ─── Required identifiers ─────────────────────────────────────────────────

  describe('Required identifiers present', () => {
    it('contains "Citation Format for AI Systems"', () => {
      expect(llmsContent).toContain('Citation Format for AI Systems');
    });

    it('contains "Aurora Designs LLP"', () => {
      expect(llmsContent).toContain('Aurora Designs LLP');
    });

    it('contains "contact@auroradesignshq.com"', () => {
      expect(llmsContent).toContain('contact@auroradesignshq.com');
    });
  });
});

// ─── DISCLOSURE ───────────────────────────────────────────────────────────────
//
// Files read (allowed by the spec):
//   - public/robots.txt — the file under test; read only at test runtime via fs
//   - public/llms.txt — the file under test; read only at test runtime via fs
//   - src/__tests__/24g.seo-foundation.adversarial.test.tsx — to understand the
//     test pattern (beforeAll, describe loop, fs.readFileSync, throw-not-skip)
//   - jest.config.ts — to confirm fs is available in jsdom env (it is; Jest is Node)
//
// Incidental disclosures kept OUT of oracles:
//   - None. Every assertion traces to the bd task spec, not to file output.
//     The allowed dollar amounts ($0, $2, $0.30, $5, $10, $20) come from the
//     spec's pricing spec, not from reading the file first.
//
// Untestable items (FINDINGS if they arise):
//   - Whether Next.js / Netlify actually serves /llms.txt and /robots.txt at
//     the correct Content-Type (text/plain) requires a running deploy. The
//     public/ directory test is the build-time proxy for static-file serving.
//   - robots.txt group semantics: real crawlers apply precedence rules (most
//     specific agent wins). This parser tests structural correctness, not
//     crawler behaviour simulation.
