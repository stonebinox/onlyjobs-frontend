/**
 * ADVERSARIAL TESTS — setUserPersonProperties guard + payload
 *
 * Oracle: contract spec only. PROHIBITION: bodies of analytics.ts and AuthContext.tsx NOT read.
 * Permitted reads: src/types/User.ts, src/types/Preferences.ts.
 *
 * Uses the REAL analytics module. posthog-js is mocked as the spy substrate.
 * Calls identifyUser(user.id) before every guard-passing test case.
 * afterEach: resetAnalyticsUser() clears currentIdentityId so tests are isolated.
 */

import type { User } from "@/types/User";

// ── posthog-js mock (spy substrate for the real analytics module) ──────────────
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    capture: jest.fn(),
    setPersonProperties: jest.fn(),
  },
}));

// ── Module-level slots populated in beforeAll ──────────────────────────────────
let sut: (user: User) => void;
let identify: (id: string) => void;
let resetIdentity: () => void;
let phSpy: jest.Mock;

// ── Shared fixture ─────────────────────────────────────────────────────────────

const makeUser = (): User => ({
  id: "user-adv-guard-001",
  name: "Alice Guard",
  email: "alice@guard-test.invalid",
  phone: "+1-555-GUARD",
  currentLocation: "Guard City, TX",
  createdAt: new Date("2024-05-01"),
  resume: {
    summary: "Guard engineer",
    skills: ["TypeScript"],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
    achievements: [],
    volunteerExperience: [],
    interests: [],
  },
  preferences: {
    jobTypes: ["full-time"],
    location: ["remote"],
    remoteOnly: false,
    minSalary: 80000,
    industries: ["tech"],
    minScore: 65,
    matchingEnabled: true,
  },
  isVerified: true,
  answeredQuestionsCount: 3,
  socialLinks: { linkedin: "https://linkedin.com/in/guard-alice" },
});

// ═══════════════════════════════════════════════════════════════════════════════
// PART 1 — Guard + payload (POSTHOG_KEY set, real analytics)
// ═══════════════════════════════════════════════════════════════════════════════

describe("setUserPersonProperties — guard + payload (key set)", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "ph-guard-adversarial-key";
    jest.resetModules();
    // Load posthog mock FIRST so analytics.ts picks up the spy when required.
    const ph = require("posthog-js").default as Record<string, jest.Mock>;
    phSpy = ph.setPersonProperties;
    const mod = require("@/utils/analytics") as {
      setUserPersonProperties: (user: User) => void;
      identifyUser: (id: string) => void;
      resetAnalyticsUser: () => void;
    };
    sut = mod.setUserPersonProperties;
    identify = mod.identifyUser;
    resetIdentity = mod.resetAnalyticsUser;
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    jest.resetModules();
  });

  afterEach(() => {
    // Clear currentIdentityId so guard state doesn't bleed between tests.
    resetIdentity();
    jest.clearAllMocks();
  });

  // ── Happy path: allow-list payload ──────────────────────────────────────────
  it("HAPPY: identifyUser then setUserPersonProperties → called once with allow-list", () => {
    const u = makeUser();
    identify(u.id);
    sut(u);

    expect(phSpy).toHaveBeenCalledTimes(1);
    const payload = phSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      is_verified: true,
      has_resume: true,
      matching_enabled: true,
      min_score: 65,
    });
  });

  // ── PII keys absent ──────────────────────────────────────────────────────────
  it("PII keys absent from posthog payload", () => {
    const u = makeUser();
    identify(u.id);
    sut(u);

    const payload = phSpy.mock.calls[0][0] as Record<string, unknown>;
    const piiKeys = [
      "email", "name", "phone", "currentLocation",
      "id", "createdAt", "socialLinks", "answeredQuestionsCount", "resume",
    ];
    for (const key of piiKeys) {
      expect(payload).not.toHaveProperty(key);
    }
  });

  // ── PII values absent (value-level scan) ────────────────────────────────────
  it("PII values absent from serialized payload (value-level)", () => {
    const u = makeUser();
    identify(u.id);
    sut(u);

    const payloadStr = JSON.stringify(phSpy.mock.calls[0][0]);
    expect(payloadStr).not.toContain("alice@guard-test.invalid");
    expect(payloadStr).not.toContain("Alice Guard");
    expect(payloadStr).not.toContain("+1-555-GUARD");
    expect(payloadStr).not.toContain("Guard City");
    expect(payloadStr).not.toContain("user-adv-guard-001");
    expect(payloadStr).not.toContain("guard-alice");
    expect(payloadStr).not.toContain("2024-05-01");
  });

  // ── Falsy zero ───────────────────────────────────────────────────────────────
  it("FALSY-ZERO: min_score:0 emitted — not dropped as falsy", () => {
    const u = makeUser();
    u.preferences!.minScore = 0;
    identify(u.id);
    sut(u);

    const payload = phSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toHaveProperty("min_score");
    expect(payload.min_score).toBe(0);
  });

  // ── matching_enabled both directions ─────────────────────────────────────────
  it("matching_enabled: true when preferences.matchingEnabled is true", () => {
    const u = makeUser();
    u.preferences!.matchingEnabled = true;
    identify(u.id);
    sut(u);

    const payload = phSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toHaveProperty("matching_enabled", true);
  });

  it("matching_enabled: false (not omitted) when preferences.matchingEnabled is false", () => {
    const u = makeUser();
    u.preferences!.matchingEnabled = false;
    identify(u.id);
    sut(u);

    const payload = phSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toHaveProperty("matching_enabled");
    expect(payload.matching_enabled).toBe(false);
  });

  // ── null preferences ─────────────────────────────────────────────────────────
  it("null preferences → matching_enabled key ABSENT", () => {
    const u = makeUser();
    u.preferences = null;
    identify(u.id);
    sut(u);

    const payload = phSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("matching_enabled");
  });

  it("null preferences → min_score key ABSENT", () => {
    const u = makeUser();
    u.preferences = null;
    identify(u.id);
    sut(u);

    const payload = phSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("min_score");
  });

  it("null preferences → is_verified and has_resume still present", () => {
    const u = makeUser();
    u.preferences = null;
    identify(u.id);
    sut(u);

    const payload = phSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toHaveProperty("is_verified");
    expect(payload).toHaveProperty("has_resume");
  });

  // ── has_resume boundary ──────────────────────────────────────────────────────
  it("has_resume: false when resume is null", () => {
    const u = makeUser();
    u.resume = null;
    identify(u.id);
    sut(u);

    const payload = phSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.has_resume).toBe(false);
  });

  it("has_resume: true when resume is an object (even with empty arrays)", () => {
    const u = makeUser();
    u.resume = {
      summary: "", skills: [], experience: [], education: [], projects: [],
      certifications: [], languages: [], achievements: [],
      volunteerExperience: [], interests: [],
    };
    identify(u.id);
    sut(u);

    const payload = phSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.has_resume).toBe(true);
  });

  // ── is_verified boundary ─────────────────────────────────────────────────────
  it("is_verified: true when isVerified is true", () => {
    const u = makeUser();
    u.isVerified = true;
    identify(u.id);
    sut(u);
    expect((phSpy.mock.calls[0][0] as Record<string, unknown>).is_verified).toBe(true);
  });

  it("is_verified: false when isVerified is false", () => {
    const u = makeUser();
    u.isVerified = false;
    identify(u.id);
    sut(u);
    expect((phSpy.mock.calls[0][0] as Record<string, unknown>).is_verified).toBe(false);
  });

  it("is_verified: false when isVerified is undefined (!!undefined === false)", () => {
    const u = makeUser();
    u.isVerified = undefined;
    identify(u.id);
    sut(u);
    expect((phSpy.mock.calls[0][0] as Record<string, unknown>).is_verified).toBe(false);
  });

  // ── GUARD: no identity ───────────────────────────────────────────────────────
  it("GUARD-no-identity: setUserPersonProperties WITHOUT prior identifyUser → NOT called", () => {
    // Do NOT call identify() — guard (b) must block
    sut(makeUser());
    expect(phSpy).not.toHaveBeenCalled();
  });

  // ── GUARD: mismatched id ──────────────────────────────────────────────────────
  it("GUARD-mismatch: identifyUser('A') then setUserPersonProperties({id:'B'}) → NOT called", () => {
    identify("user-id-A");
    sut({ ...makeUser(), id: "user-id-B" });
    expect(phSpy).not.toHaveBeenCalled();
  });

  // ── GUARD: after reset ────────────────────────────────────────────────────────
  it("GUARD-after-reset: identify → resetAnalyticsUser → setUserPersonProperties → NOT called", () => {
    const u = makeUser();
    identify(u.id);
    resetIdentity(); // clears identity
    jest.clearAllMocks();
    sut(u);
    expect(phSpy).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PART 2 — Guard: no POSTHOG_KEY (module-reset variant)
// ═══════════════════════════════════════════════════════════════════════════════

describe("setUserPersonProperties — guard: no POSTHOG_KEY", () => {
  let sutNoKey: (user: User) => void;
  let identifyNoKey: (id: string) => void;
  let resetNoKey: () => void;
  let phSpyNoKey: jest.Mock;

  beforeAll(() => {
    // Ensure key is absent when the fresh module is evaluated.
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    jest.resetModules();
    const ph = require("posthog-js").default as Record<string, jest.Mock>;
    phSpyNoKey = ph.setPersonProperties;
    const mod = require("@/utils/analytics") as {
      setUserPersonProperties: (user: User) => void;
      identifyUser: (id: string) => void;
      resetAnalyticsUser: () => void;
    };
    sutNoKey = mod.setUserPersonProperties;
    identifyNoKey = mod.identifyUser;
    resetNoKey = mod.resetAnalyticsUser;
  });

  afterAll(() => {
    jest.resetModules();
  });

  afterEach(() => {
    resetNoKey();
    jest.clearAllMocks();
  });

  it("GUARD-no-key: even after identifyUser, posthog.setPersonProperties NOT called when key absent", () => {
    const u = makeUser();
    identifyNoKey(u.id);
    sutNoKey(u);
    expect(phSpyNoKey).not.toHaveBeenCalled();
  });
});

/*
 * ── DISCLOSURE ──────────────────────────────────────────────────────────────
 *
 * FILES NOT OPENED (forbidden):
 *   src/utils/analytics.ts      — NOT read. Real module used black-box.
 *   src/contexts/AuthContext.tsx — NOT read. Not needed for these unit tests.
 *
 * FILES READ (permitted):
 *   src/types/User.ts      — explicitly permitted; used for fixture types.
 *   src/types/Preferences.ts — explicitly permitted; used for fixture types.
 *
 * INCIDENTAL DISCLOSURES:
 *   None. The makeUser fixture is derived entirely from the User and Preferences
 *   type shapes, not from reading implementation files. The contract spec provided
 *   all necessary information about which guard conditions to test and which
 *   properties constitute the allow-list.
 *
 * UNTESTABLE-WITHOUT-READING:
 *   None in this file. All guard conditions (key absent, no identity, mismatch,
 *   after-reset) are directly exercisable from the public API surface.
 */
