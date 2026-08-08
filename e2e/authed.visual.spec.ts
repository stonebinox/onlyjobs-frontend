import { test, expect, Page } from "@playwright/test";
import path from "path";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";
const SCREENSHOTS = path.join(__dirname, "screenshots");

// Compute ISO strings relative to now so odds-line buckets are always correct
const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString();

// ── Fixture data ────────────────────────────────────────────────────────────

const USER = {
  id: "user-fixture-001",
  name: "Alex Rivera",
  email: "alex@example.com",
  phone: null,
  currentLocation: "Remote",
  createdAt: new Date("2026-01-01").toISOString(),
  isVerified: true,
  resume: {
    summary: "Full-stack engineer with 6 years building React/Node.js products.",
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    experience: [
      "Senior Engineer at Acme Corp (2022–present)",
      "Engineer at StartupXYZ (2020–2022)",
    ],
    education: ["BS Computer Science, State University"],
    projects: ["Internal analytics dashboard used by 200 employees"],
    certifications: [],
    languages: ["English"],
    achievements: [],
    volunteerExperience: [],
    interests: [],
  },
  preferences: {
    jobTypes: ["full-time"],
    industries: ["technology"],
    location: ["Remote"],
    remoteOnly: true,
    minSalary: 80000,
    minScore: 0,
    matchingEnabled: true,
  },
  answeredQuestionsCount: 5,
};

// Four matches — one per verdict, spread across the three odds-line buckets
const MATCHES = [
  {
    _id: "match-strong-001",
    userId: "user-fixture-001",
    jobId: "job-strong-001",
    matchScore: 91,
    verdict: "Strong match",
    reasoning:
      "Excellent alignment: TypeScript, React and distributed systems all present.",
    clicked: false,
    skipped: false,
    applied: null,
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
    job: {
      _id: "job-strong-001",
      title: "Senior TypeScript Developer",
      company: "CloudScale Inc",
      location: ["Remote"],
      salary: { min: 140000, max: 180000, currency: "USD", estimated: false },
      tags: ["TypeScript", "React"],
      source: "greenhouse",
      description:
        "Build scalable TypeScript applications for a distributed SaaS platform.",
      url: "https://example.com/jobs/strong-001",
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
      postedDate: daysAgo(0), // today → early bucket → STRONG green
      scrapedDate: daysAgo(0),
    },
  },
  {
    _id: "match-mild-002",
    userId: "user-fixture-001",
    jobId: "job-mild-002",
    matchScore: 65,
    verdict: "Mild match",
    reasoning:
      "Good Node.js fit; some DevOps gaps but overall reasonable alignment.",
    clicked: false,
    skipped: false,
    applied: null,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
    job: {
      _id: "job-mild-002",
      title: "Full Stack Node.js Engineer",
      company: "DevStream Co",
      location: ["Remote", "New York, NY"],
      salary: { min: 110000, max: 140000, currency: "USD", estimated: false },
      tags: ["Node.js", "DevOps"],
      source: "linkedin",
      description: "Join a growing team building real-time data pipelines.",
      url: "https://example.com/jobs/mild-002",
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
      postedDate: daysAgo(5), // 5 days ago → building bucket → LOOK gold
      scrapedDate: daysAgo(5),
    },
  },
  {
    _id: "match-weak-003",
    userId: "user-fixture-001",
    jobId: "job-weak-003",
    matchScore: 38,
    verdict: "Weak match",
    reasoning: "Requires Rust expertise not present in the profile.",
    clicked: false,
    skipped: false,
    applied: null,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(20),
    job: {
      _id: "job-weak-003",
      title: "Systems Programmer (Rust)",
      company: "LowLevel Labs",
      location: ["Remote"],
      salary: { min: 130000, max: 160000, currency: "USD", estimated: true },
      tags: ["Rust", "Systems"],
      source: "remoteok",
      description:
        "Build high-performance networking libraries in Rust.",
      url: "https://example.com/jobs/weak-003",
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
      postedDate: daysAgo(20), // 20 days ago → late bucket → QUIET grey
      scrapedDate: daysAgo(20),
    },
  },
  {
    _id: "match-none-004",
    userId: "user-fixture-001",
    jobId: "job-none-004",
    matchScore: 12,
    verdict: "No match",
    reasoning:
      "Very different domain (embedded C firmware) from the candidate profile.",
    clicked: false,
    skipped: false,
    applied: null,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(20),
    job: {
      _id: "job-none-004",
      title: "Embedded C Engineer",
      company: "HardwareBase",
      location: ["San Jose, CA"],
      salary: { min: 95000, max: 125000, currency: "USD", estimated: false },
      tags: ["C", "Embedded"],
      source: "indeed",
      description: "Develop firmware for IoT devices in C.",
      url: "https://example.com/jobs/none-004",
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
      postedDate: daysAgo(20), // 20 days ago → late bucket → QUIET grey
      scrapedDate: daysAgo(20),
    },
  },
];

// Two tracker entries: one 20 days quiet (triggers follow-up nudge), one with heard_back outcome
const TRACKER = [
  {
    _id: "match-t1",
    userId: "user-fixture-001",
    jobId: "job-t1",
    matchScore: 78,
    verdict: "Strong match",
    reasoning: "Strong React fit.",
    clicked: true,
    applied: true,
    appliedAt: daysAgo(20), // 20 days quiet, no outcome → should show follow-up nudge
    skipped: false,
    createdAt: daysAgo(21),
    updatedAt: daysAgo(20),
    job: {
      _id: "job-t1",
      title: "Senior React Engineer",
      company: "Tracker Corp",
      location: ["Remote"],
      salary: { min: 120000, max: 150000, currency: "USD", estimated: false },
      tags: ["React", "Redux"],
      source: "greenhouse",
      description: "Senior React role at a product company.",
      url: "https://example.com/jobs/t1",
      createdAt: daysAgo(21),
      updatedAt: daysAgo(21),
      postedDate: daysAgo(21),
      scrapedDate: daysAgo(21),
    },
  },
  {
    _id: "match-t2",
    userId: "user-fixture-001",
    jobId: "job-t2",
    matchScore: 60,
    verdict: "Mild match",
    reasoning: "Decent fit.",
    clicked: true,
    applied: true,
    appliedAt: daysAgo(3),
    applicationOutcome: "heard_back",
    skipped: false,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(3),
    job: {
      _id: "job-t2",
      title: "Frontend Developer",
      company: "StartupABC",
      location: ["Remote"],
      salary: { min: 90000, max: 115000, currency: "USD", estimated: false },
      tags: ["Vue", "TypeScript"],
      source: "linkedin",
      description: "Frontend role at a fast-growing startup.",
      url: "https://example.com/jobs/t2",
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
      postedDate: daysAgo(4),
      scrapedDate: daysAgo(4),
    },
  },
];

// Browse page: two raw jobs, no matches yet
const JOBS = {
  jobs: [
    {
      _id: "rawjob-b1",
      title: "Frontend Engineer",
      company: "Browse Inc",
      location: ["Remote"],
      salary: { min: 100000, max: 130000, currency: "USD" },
      source: "linkedin",
      description: "Build beautiful React UIs for millions of users.",
      url: "https://example.com/jobs/b1",
      postedDate: daysAgo(1),
      match: null,
    },
    {
      _id: "rawjob-b2",
      title: "Backend Python Engineer",
      company: "DataStream Ltd",
      location: ["Remote"],
      salary: { min: 110000, max: 145000, currency: "USD" },
      source: "greenhouse",
      description: "Python microservices for a data pipeline platform.",
      url: "https://example.com/jobs/b2",
      postedDate: daysAgo(3),
      match: null,
    },
  ],
  total: 2,
  page: 1,
  pages: 1,
  sources: ["linkedin", "greenhouse"],
};

// ── Route mock setup ────────────────────────────────────────────────────────

async function setupApiRoutes(page: Page) {
  await page.route(`${API}/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const pathname = new URL(url).pathname;

    if (method === "GET") {
      if (pathname === "/api/users/profile") {
        return route.fulfill({ json: { user: USER } });
      }
      if (pathname === "/api/users/username") {
        return route.fulfill({ json: { name: USER.name } });
      }
      if (pathname === "/api/wallet/balance") {
        return route.fulfill({ json: { balance: 2.5 } });
      }
      if (pathname === "/api/matches/out-of-credit-preview") {
        return route.fulfill({
          json: {
            shouldShow: false,
            reason: "",
            walletBalance: 2.5,
            dailyMatchCost: 0.3,
            onDemandMatchCost: 0.05,
            count: 0,
            candidates: [],
          },
        });
      }
      if (pathname === "/api/matches/tracker") {
        return route.fulfill({ json: TRACKER });
      }
      if (pathname === "/api/matches/skipped") {
        return route.fulfill({ json: [] });
      }
      if (pathname === "/api/matches") {
        return route.fulfill({ json: MATCHES });
      }
      if (pathname === "/api/jobs") {
        return route.fulfill({ json: JOBS });
      }
      if (pathname.startsWith("/api/chat")) {
        return route.fulfill({ json: [] });
      }
      if (pathname === "/api/users/guide-progress") {
        return route.fulfill({
          json: {
            guideProgress: {
              dashboard: { completed: true },
              wallet: { completed: true },
              settings: { completed: true },
              profile: { completed: true },
            },
          },
        });
      }
      if (pathname === "/api/wallet/transactions") {
        return route.fulfill({
          json: {
            transactions: [
              {
                _id: "tx-001",
                type: "credit",
                amount: 10,
                description: "Wallet top-up",
                status: "completed",
                timestamp: new Date("2026-07-01").toISOString(),
              },
              {
                _id: "tx-002",
                type: "debit",
                amount: 0.3,
                description: "Daily match charge",
                status: "completed",
                timestamp: new Date("2026-07-02").toISOString(),
              },
            ],
          },
        });
      }
      if (pathname === "/api/users/answers") {
        return route.fulfill({
          json: {
            answeredQuestions: [
              {
                id: "q-001",
                question: "Why are you looking for a new role?",
                answer: "Looking for growth opportunities in a product-focused team.",
                mode: "text",
              },
            ],
          },
        });
      }
    }

    // Fire-and-forget endpoints
    if (method === "POST" && pathname.endsWith("/session/touch")) {
      return route.fulfill({ json: { ok: true } });
    }

    if (method === "POST" && pathname === "/api/chat/conversations") {
      return route.fulfill({
        json: {
          conversationId: "conv-e2e",
          messages: [
            { role: "user", content: "What are my chances for this role?" },
            {
              role: "assistant",
              content:
                "Based on your React and TypeScript background, this is a strong match — your profile covers the core stack. To strengthen it, consider highlighting any distributed-systems experience.",
            },
          ],
        },
      });
    }

    if (method === "POST" && pathname === "/api/chat") {
      return route.fulfill({
        json: { reply: "Sure — happy to help with that.", conversationId: "conv-e2e" },
      });
    }

    // Catch-all: return empty success so unrecognised calls don't throw
    return route.fulfill({ status: 200, json: {} });
  });
}

// ── Auth setup ──────────────────────────────────────────────────────────────

async function setupAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("onlyjobs_token", "fixture-token-abc123");
    localStorage.setItem("onlyjobs_user_id", "user-fixture-001");
    // Dismiss cookie consent so the overlay doesn't obscure screenshots
    localStorage.setItem("oj_cookie_consent", "1");
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

test.describe("authenticated pages visual", () => {
  test.beforeEach(async ({ page }) => {
    // Routes and auth must be wired before any navigation
    await setupApiRoutes(page);
    await setupAuth(page);
  });

  test("/today — verdict badges and odds-line colours", async (
    { page },
    testInfo
  ) => {
    const proj = testInfo.project.name;
    await page.goto("/today");

    // Guard: fixture job title must be visible — proves mocks fired and page rendered
    await expect(
      page.getByText("Senior TypeScript Developer")
    ).toBeVisible({ timeout: 15000 });

    await page.screenshot({
      path: path.join(SCREENSHOTS, `today-${proj}.png`),
      fullPage: true,
    });
  });

  test("/tracker — applied columns and follow-up nudge", async (
    { page },
    testInfo
  ) => {
    const proj = testInfo.project.name;
    await page.goto("/tracker");

    // Guard: fixture card must appear in the Applied column
    await expect(page.getByText("Senior React Engineer")).toBeVisible({
      timeout: 15000,
    });

    await page.screenshot({
      path: path.join(SCREENSHOTS, `tracker-${proj}.png`),
      fullPage: true,
    });
  });

  test("/tracker — card opens detail drawer", async ({ page }, testInfo) => {
    await page.goto("/tracker");

    // Guard: fixture card must be visible before attempting interaction
    await expect(page.getByText("Senior React Engineer")).toBeVisible({
      timeout: 15000,
    });

    // Click the company name — a plain Text node (no stopPropagation), so the click
    // bubbles up to the card Box (role="button") and fires onOpenDetails.
    // The title is a Link with stopPropagation so clicking it would open a new tab;
    // the "Move to" button also stops propagation.
    await page.getByText("Tracker Corp").click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Wait for useBreakpointValue to settle and the slide animation to complete
    // before measuring or screenshotting — avoids capturing the pre-resolution frame.
    await page.waitForTimeout(400);

    // Light guard: drawer header and reasoning must reflect the fixture match
    await expect(dialog.getByText(/Senior React Engineer/i)).toBeVisible();
    await expect(dialog.getByText(/Strong React fit/i)).toBeVisible();

    // Guard: Ask-AI chat section must render with the seeded conversation
    await expect(page.getByText("Ask AI about this job")).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText(/Based on your React and TypeScript background/i)
    ).toBeVisible({ timeout: 5000 });

    // HARD assertion (mobile only): drawer must fill the full viewport width.
    // useBreakpointValue returns "full" at base (mobile) → Chakra Drawer should be 100vw.
    if (testInfo.project.name === "mobile") {
      const box = await page.getByRole("dialog").boundingBox();
      const vw = page.viewportSize()!.width;
      expect(box!.width).toBeGreaterThanOrEqual(vw - 2);
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS, `tracker-drawer-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });

  test("/browse — all jobs tab with two fixture listings", async (
    { page },
    testInfo
  ) => {
    const proj = testInfo.project.name;
    await page.goto("/browse");

    // Guard: fixture listing must be visible — proves /jobs mock fired and AllJobsTab rendered
    await expect(page.getByText("Frontend Engineer")).toBeVisible({
      timeout: 15000,
    });

    await page.screenshot({
      path: path.join(SCREENSHOTS, `browse-${proj}.png`),
      fullPage: true,
    });
  });

  test("/wallet — balance and transaction history", async (
    { page },
    testInfo
  ) => {
    const proj = testInfo.project.name;
    await page.goto("/wallet");

    // Guard: balance card heading must be visible — proves /wallet/balance mock fired
    await expect(page.getByText("Wallet Balance")).toBeVisible({
      timeout: 15000,
    });
    // Guard: fixture transaction must be visible — proves /wallet/transactions mock fired
    await expect(page.getByText("Wallet top-up")).toBeVisible({
      timeout: 15000,
    });

    await page.screenshot({
      path: path.join(SCREENSHOTS, `wallet-${proj}.png`),
      fullPage: true,
    });
  });

  test("/settings — account and preferences form", async (
    { page },
    testInfo
  ) => {
    const proj = testInfo.project.name;
    await page.goto("/settings");

    // Guard: account settings card heading must be visible — proves profile mock fired and page rendered
    await expect(page.getByRole("heading", { name: "Account Settings" })).toBeVisible({
      timeout: 15000,
    });

    await page.screenshot({
      path: path.join(SCREENSHOTS, `settings-${proj}.png`),
      fullPage: true,
    });
  });

  test("/profile — resume, skills and badge palette (QA surface)", async (
    { page },
    testInfo
  ) => {
    const proj = testInfo.project.name;
    await page.goto("/profile");

    // Guard: fixture user name must be visible — proves /users/profile mock fired
    await expect(page.getByText("Alex Rivera")).toBeVisible({
      timeout: 15000,
    });
    // Guard: skills section must render — exercises the blue badge palette from palette.ts
    await expect(page.getByText("Resume Summary")).toBeVisible({
      timeout: 15000,
    });

    await page.screenshot({
      path: path.join(SCREENSHOTS, `profile-${proj}.png`),
      fullPage: true,
    });
  });

  test("/browse — Q&A drawer is full-screen and usable on mobile", async (
    { page },
    testInfo
  ) => {
    // Override /api/jobs to include one analyzed job (match !== null) so AllJobsTab
    // renders a JobListing with the "Write Answer with AI" trigger that opens the drawer.
    // The base JOBS fixture has match: null on both jobs — no trigger would render without this.
    await page.route(`${API}/jobs*`, (route) =>
      route.fulfill({
        json: {
          jobs: [
            {
              _id: "rawjob-analyzed-01",
              title: "React Developer",
              company: "Analyzed Corp",
              location: ["Remote"],
              salary: { min: 120000, max: 150000, currency: "USD" },
              source: "linkedin",
              description: "Build beautiful React UIs for millions of users.",
              url: "https://example.com/jobs/analyzed-01",
              postedDate: daysAgo(1),
              match: {
                _id: "match-analyzed-01",
                matchScore: 85,
                verdict: "Strong match",
                reasoning: "Strong React and TypeScript fit.",
                skipped: false,
                applied: null,
                updatedAt: daysAgo(0),
              },
            },
          ],
          total: 1,
          page: 1,
          pages: 1,
          sources: ["linkedin"],
        },
      })
    );

    await page.goto("/browse");

    // Guard: analyzed listing must be visible — proves override fired and JobListing rendered
    await expect(page.getByText("React Developer")).toBeVisible({ timeout: 15000 });

    // Open the drawer via "Write Answer with AI" (rendered by JobListing for analyzed jobs only)
    await page.getByRole("button", { name: "Write Answer with AI" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Wait for the open animation to settle before measuring
    await page.waitForTimeout(400);

    // HARD assertion: drawer must fill the viewport width on mobile (not applicable on desktop)
    if (testInfo.project.name === "mobile") {
      const box = await page.getByRole("dialog").boundingBox();
      const vw = page.viewportSize()!.width;
      expect(box!.width).toBeGreaterThanOrEqual(vw - 2);
    }

    // No horizontal overflow: full-screen drawer must not push document width at 390px
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1
    );
    expect(overflow).toBe(false);

    // Both drawer sections must render on mobile (apply prompt + Q&A generator)
    await expect(dialog.getByText(/did you apply/i)).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /generate answer/i })).toBeVisible();

    // Close control must be present (guards against header/close-button collision)
    await expect(dialog.getByRole("button", { name: /close/i })).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOTS, `drawer-mobile-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });

  test("/onboarding — quick-profile + country picker + trigger gate", async (
    { page },
    testInfo
  ) => {
    const proj = testInfo.project.name;

    // No meaningful resume and no currentLocation → !hasResume branch renders quick-profile +
    // country picker, and "Find my first matches" button is disabled
    await page.route(`${API}/users/profile`, (route) =>
      route.fulfill({
        json: {
          user: {
            ...USER,
            resume: {},
            currentLocation: null,
          },
        },
      })
    );

    await page.goto("/onboarding");

    // Guard: quick-profile section only renders when !hasResume
    await expect(page.getByText("Quick profile")).toBeVisible({ timeout: 15000 });
    // Guard: country picker is always shown on the onboarding page
    await expect(page.getByText("Where are you based?")).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: path.join(SCREENSHOTS, `onboarding-${proj}.png`),
      fullPage: true,
    });
  });

  test("/tracker?followup=true — follow-up outcome wizard opens", async (
    { page },
    testInfo
  ) => {
    const proj = testInfo.project.name;

    // One applied job, no applicationOutcome, 21 days quiet → satisfies shouldShowFollowUp (≥14 days)
    await page.route(`${API}/matches/tracker`, (route) =>
      route.fulfill({
        json: [
          {
            _id: "match-fu1",
            userId: "user-fixture-001",
            jobId: "job-fu1",
            matchScore: 72,
            verdict: "Strong match",
            reasoning: "Good React fit.",
            clicked: true,
            applied: true,
            appliedAt: daysAgo(21),
            skipped: false,
            createdAt: daysAgo(22),
            updatedAt: daysAgo(21),
            job: {
              _id: "job-fu1",
              title: "Senior React Developer",
              company: "FollowUp Corp",
              location: ["Remote"],
              salary: { min: 110000, max: 140000, currency: "USD", estimated: false },
              tags: ["React"],
              source: "greenhouse",
              description: "React role needing follow-up.",
              url: "https://example.com/jobs/fu1",
              createdAt: daysAgo(22),
              updatedAt: daysAgo(22),
              postedDate: daysAgo(22),
              scrapedDate: daysAgo(22),
            },
          },
        ],
      })
    );

    await page.goto("/tracker?followup=true");

    // Guard: wizard dialog must open automatically once jobs load and ?followup=true is present
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });
    // Guard: modal header content confirms the right wizard rendered
    await expect(dialog.getByText(/did you hear back/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: path.join(SCREENSHOTS, `followup-wizard-${proj}.png`),
      fullPage: true,
    });
  });

  test("/today — location prompt for a user with no currentLocation", async (
    { page },
    testInfo
  ) => {
    const proj = testInfo.project.name;

    // Meaningful resume (isVerified) but no currentLocation → LocationPromptBanner is shown
    await page.route(`${API}/users/profile`, (route) =>
      route.fulfill({
        json: {
          user: {
            ...USER,
            currentLocation: null,
          },
        },
      })
    );

    await page.goto("/today");

    // Guard: a match card must render — proves /matches mock fired and the brief rendered
    await expect(page.getByText("Senior TypeScript Developer")).toBeVisible({
      timeout: 15000,
    });
    // Guard: LocationPromptBanner AlertTitle must be visible — proves banner rendered
    await expect(page.getByText("Where are you based?")).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: path.join(SCREENSHOTS, `today-location-prompt-${proj}.png`),
      fullPage: true,
    });
  });

  test("/settings — country picker (currentLocation)", async (
    { page },
    testInfo
  ) => {
    const proj = testInfo.project.name;
    await page.goto("/settings");

    // Guard: account settings must load
    await expect(
      page.getByRole("heading", { name: "Account Settings" })
    ).toBeVisible({ timeout: 15000 });
    // Guard: CountrySelect for currentLocation must be present (Chakra FormControl id="currentLocation")
    await expect(page.getByLabel("Current Location")).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: path.join(SCREENSHOTS, `settings-location-${proj}.png`),
      fullPage: true,
    });
  });

  test("/profile — long name/email/location does not overflow (mobile guard)", async (
    { page },
    testInfo
  ) => {
    const LONG_NAME = "Alexandria Wilhelmina Featherstonehaugh-Cholmondeley III";
    const LONG_EMAIL =
      "alexandria.wilhelmina.featherstonehaugh@a-very-long-corporate-subdomain.example.com";
    const LONG_LOCATION =
      "Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch, Wales, United Kingdom";

    // Override the profile route with very long fields — later routes take precedence (LIFO)
    await page.route(`${API}/users/profile`, (route) =>
      route.fulfill({
        json: {
          user: {
            ...USER,
            name: LONG_NAME,
            email: LONG_EMAIL,
            currentLocation: LONG_LOCATION,
          },
        },
      })
    );

    await page.goto("/profile");

    // Guard: long name must appear — proves the override mock fired and page rendered
    await expect(page.getByText("Alexandria Wilhelmina")).toBeVisible({
      timeout: 15000,
    });

    // Assert no horizontal overflow at the document level
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1
    );
    expect(overflow).toBe(false);

    // HARD assertion (mobile only): email must be clipped to its container, not escaping the card.
    // scrollWidth > clientWidth is true only when the element is bounded and ellipsized (Fix 1 working);
    // it is false when the element grows to fit the full text (the bug).
    if (testInfo.project.name === "mobile") {
      const emailLocator = page.getByText(LONG_EMAIL);
      const clipped = await emailLocator.evaluate(
        (el) => el.scrollWidth > el.clientWidth
      );
      expect(clipped).toBe(true);
    }

    await page.screenshot({
      path: path.join(
        SCREENSHOTS,
        `profile-longdata-${testInfo.project.name}.png`
      ),
      fullPage: true,
    });
  });
});
