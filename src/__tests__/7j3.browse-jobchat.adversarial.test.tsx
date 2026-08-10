/**
 * ADVERSARIAL TESTS — onlyjobs-7j3: per-job AI chat on /browse (AllJobsTab).
 *
 * Assume the wiring is subtly wrong; tests are written to EXPOSE bugs.
 * Report PASS/FAIL. Failures are FINDINGS. Do NOT modify production code.
 *
 * FORBIDDEN (not opened):
 *   src/components/AllJobsTab.tsx
 *   src/components/Dashboard/JobListing.tsx
 *
 * CONTRACT (oracle — all assertions trace here):
 *   1. NO_EAGER_MOUNT: rendering with matched jobs makes ZERO createOrGetJobConversation
 *      calls before any card is expanded.
 *   2. EXPAND_MATCHED_RIGHT_ID: expanding a matched card calls createOrGetJobConversation
 *      exactly once, with job.match._id — NOT job._id.
 *   3. UNMATCHED_NO_CHAT: unmatched card renders no chat, zero createOrGetJobConversation
 *      calls even after interaction.
 *   4. SIBLING_ISOLATION: expanding card A uses A's match._id; expanding B uses B's — never shared.
 *   5. AFTER_ON_DEMAND_MATCH: after matchJobOnDemand resolves, expanding the now-matched card
 *      calls with the NEW match._id returned from matchJobOnDemand.
 *   6. EXISTING_FLOWS: openJobQuestionsDrawer, skip, source-filter still work with aiSection added.
 *   7. FAILURE_ISOLATION: createOrGetJobConversation rejecting / resolving {error} does not crash page.
 *
 * DISCLOSURE: see bottom of file.
 */

// ─── Mock control variables ───────────────────────────────────────────────────

let mockGetAllJobs: jest.Mock;
let mockCreateOrGetJobConversation: jest.Mock;
let mockMatchJobOnDemand: jest.Mock;
let mockOpenJobQuestionsDrawer: jest.Mock;
let mockMarkMatchAsSkipped: jest.Mock;

// ─── apiClient mock ───────────────────────────────────────────────────────────

jest.mock("@/lib/apiClient", () => ({
  __esModule: true,
  createApiClient: () => ({
    getAllJobs: (...args: any[]) => mockGetAllJobs(...args),
    createOrGetJobConversation: (...args: any[]) => mockCreateOrGetJobConversation(...args),
    matchJobOnDemand: (...args: any[]) => mockMatchJobOnDemand(...args),
    markMatchClick: jest.fn().mockResolvedValue({ success: true }),
    markMatchAsSkipped: (...args: any[]) => mockMarkMatchAsSkipped(...args),
    markMatchApplied: jest.fn().mockResolvedValue({ success: true }),
    sendChatMessage: jest.fn().mockResolvedValue({ reply: "ok", conversationId: "conv-reply" }),
    touchSession: jest.fn().mockResolvedValue(undefined),
    getMatchCount: jest.fn().mockResolvedValue(0),
    getWalletBalance: jest.fn().mockResolvedValue(1.0),
    checkWalletBalance: jest.fn().mockResolvedValue({ balance: 1.0, hasSufficientBalance: true }),
    getUserProfile: jest.fn().mockResolvedValue(null),
    getQuestion: jest.fn().mockResolvedValue(null),
    getAnsweredQuestions: jest.fn().mockResolvedValue([]),
    getOutOfCreditPreview: jest.fn().mockResolvedValue({
      shouldShow: false,
      reason: "ok",
      walletBalance: 1,
      dailyMatchCost: 0.3,
      onDemandMatchCost: 0.05,
      count: 0,
      candidates: [],
    }),
  }),
}));

// ─── Next.js mocks ────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => "/browse",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("next/head", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: any) =>
    React.createElement("a", { href, ...rest }, children),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: any) => React.createElement("img", { src, alt }),
}));

// ─── Auth context ─────────────────────────────────────────────────────────────

jest.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({
    isReady: true,
    isLoggedIn: true,
    userId: "user123",
    token: "tok-abc",
    authenticate: jest.fn(),
    logout: jest.fn(),
  }),
}));

// ─── Utility mocks ────────────────────────────────────────────────────────────

jest.mock("@/utils/analytics", () => ({
  trackEvent: jest.fn(),
  initAnalytics: jest.fn(),
  trackPageView: jest.fn(),
  identifyUser: jest.fn(),
}));

jest.mock("@/utils/verdict-colors", () => ({
  getVerdictColor: () => ({ hex: "#ccc" }),
  getVerdictRing: () => ({ hex: "#ccc", badgeBg: "green.100", badgeText: "green.800" }),
}));

jest.mock("@/utils/brief-utils", () => ({
  isSafeUrl: () => true,
  getOddsLine: () => "Good odds",
  getOddsColor: () => "green.500",
}));

jest.mock("@/utils/text-formatter", () => ({
  numberFormatter: (n: number) => String(n),
}));

// ─── Theme mock ───────────────────────────────────────────────────────────────

jest.mock("@/theme/theme", () => ({
  __esModule: true,
  default: {
    colors: {
      brand: { 50: "#EEF4FB", 500: "#1D4E89", 600: "#163B69", 700: "#112D50" },
      gray: { 50: "#F9FAFB", 100: "#F3F4F6", 200: "#E5E7EB", 500: "#6B7280" },
    },
  },
}));

// ─── Emotion mock ─────────────────────────────────────────────────────────────

jest.mock("@emotion/react", () => ({
  keyframes: () => "mock-keyframes",
  css: (...args: any[]) => args,
}));

// ─── Icon stubs (all react-icon families AllJobsTab / JobListing / JobChatSection may use) ──

jest.mock("react-icons/fi", () =>
  new Proxy({}, { get: () => () => null })
);
jest.mock("react-icons/bs", () =>
  new Proxy({}, { get: () => () => null })
);
jest.mock("react-icons/md", () =>
  new Proxy({}, { get: () => () => null })
);
jest.mock("react-icons/ai", () =>
  new Proxy({}, { get: () => () => null })
);
jest.mock("react-icons/io", () =>
  new Proxy({}, { get: () => () => null })
);
jest.mock("react-icons/io5", () =>
  new Proxy({}, { get: () => () => null })
);
jest.mock("react-icons/hi", () =>
  new Proxy({}, { get: () => () => null })
);
jest.mock("react-icons/ri", () =>
  new Proxy({}, { get: () => () => null })
);
jest.mock("react-icons/tb", () =>
  new Proxy({}, { get: () => () => null })
);
jest.mock("react-icons/lu", () =>
  new Proxy({}, { get: () => () => null })
);
jest.mock("react-icons/fa", () =>
  new Proxy({}, { get: () => () => null })
);

// ─── Sub-component stubs ──────────────────────────────────────────────────────

jest.mock("@/components/Dashboard/MatchScoreRing", () => ({
  MatchScoreRing: () => null,
}));

jest.mock("@/components/Dashboard/AIReasoningBox", () => ({
  AIReasoningBox: () => null,
}));

// ─── Chakra UI mock ───────────────────────────────────────────────────────────
// Real useDisclosure so More/Less toggle works.
// Collapse gates children on `in` prop — critical for eager-mount criterion.

jest.mock("@chakra-ui/react", () => {
  const React = require("react");
  const cache: Record<string, any> = {};

  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      (
        {
          children,
          onClick,
          onKeyDown,
          onChange,
          onKeyPress,
          value,
          defaultValue,
          type,
          disabled,
          isDisabled,
          isLoading,
          "aria-label": al,
          "data-testid": dt,
          href,
          role,
          placeholder,
          dangerouslySetInnerHTML,
        }: any,
        ref: any
      ) => {
        const props: any = {
          ref,
          onClick,
          onKeyDown,
          onChange,
          onKeyPress,
          value,
          defaultValue,
          type,
          disabled: disabled || isDisabled || isLoading || undefined,
          "aria-label": al,
          "data-testid": dt,
          href,
          role,
          placeholder,
        };
        if (dangerouslySetInnerHTML) {
          props.dangerouslySetInnerHTML = dangerouslySetInnerHTML;
          return React.createElement(tag, props);
        }
        return React.createElement(tag, props, children);
      }
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };

  // Real useDisclosure — stateful so More/Less toggle actually updates DOM
  const useDisclosure = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    return {
      isOpen,
      onOpen: () => setIsOpen(true),
      onClose: () => setIsOpen(false),
      onToggle: () => setIsOpen((v: boolean) => !v),
    };
  };

  // Collapse: gates children on `in` — central to NO_EAGER_MOUNT criterion.
  // If Collapse always renders children, the eager-mount test would be a false pass.
  const Collapse = ({ in: isIn, children }: any) =>
    isIn ? React.createElement("div", { "data-collapse": "open" }, children) : null;

  // Modal: renders children only when isOpen
  const Modal = ({ isOpen, children }: any) =>
    isOpen ? React.createElement("div", { role: "dialog" }, children) : null;
  const ModalOverlay = () => null;
  const ModalContent = ({ children }: any) => React.createElement("div", {}, children);
  const ModalHeader = ({ children }: any) => React.createElement("div", {}, children);
  const ModalBody = ({ children }: any) => React.createElement("div", {}, children);
  const ModalFooter = ({ children }: any) => React.createElement("div", {}, children);
  const ModalCloseButton = ({ onClick }: any) =>
    React.createElement("button", { onClick }, "Close");

  const Button = ({
    children,
    onClick,
    isDisabled,
    disabled,
    isLoading,
    href,
    target,
    rel,
    "aria-label": al,
  }: any) => {
    if (href !== undefined) {
      return React.createElement(
        "a",
        { href, target, rel, onClick, "aria-label": al },
        children
      );
    }
    return React.createElement(
      "button",
      {
        onClick,
        disabled: isDisabled || disabled || isLoading || undefined,
        "aria-label": al,
      },
      children
    );
  };

  const IconButton = ({
    "aria-label": al,
    onClick,
    isDisabled,
    disabled,
    isLoading,
    children,
  }: any) =>
    React.createElement(
      "button",
      {
        "aria-label": al,
        onClick,
        disabled: isDisabled || disabled || isLoading || undefined,
      },
      children ?? null
    );

  const known: Record<string, any> = {
    __esModule: true,
    ChakraProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
    Box: makeEl("div"),
    Flex: makeEl("div"),
    VStack: makeEl("div"),
    HStack: makeEl("div"),
    Stack: makeEl("div"),
    Wrap: makeEl("div"),
    WrapItem: makeEl("div"),
    Container: makeEl("div"),
    Center: makeEl("div"),
    Grid: makeEl("div"),
    GridItem: makeEl("div"),
    SimpleGrid: makeEl("div"),
    Text: makeEl("span"),
    Heading: makeEl("h3"),
    Button,
    IconButton,
    Link: ({ children, href, onClick }: any) =>
      React.createElement("a", { href, onClick }, children),
    Badge: makeEl("span"),
    Tag: makeEl("span"),
    TagLabel: ({ children }: any) => React.createElement("span", null, children),
    Divider: () => React.createElement("hr"),
    Spinner: () =>
      React.createElement("div", { role: "status", "aria-label": "Loading" }),
    Alert: ({ children, role: r }: any) =>
      React.createElement("div", { role: r ?? "alert" }, children),
    AlertIcon: () => null,
    AlertTitle: makeEl("span"),
    AlertDescription: makeEl("span"),
    // eslint-disable-next-line react/display-name
    Input: React.forwardRef(
      (
        { value, onChange, disabled, isDisabled, placeholder, type, onKeyPress, onKeyDown }: any,
        ref: any
      ) =>
        React.createElement("input", {
          ref,
          value,
          onChange,
          placeholder,
          type,
          onKeyPress,
          onKeyDown,
          disabled: disabled || isDisabled || undefined,
        })
    ),
    // eslint-disable-next-line react/display-name
    Textarea: React.forwardRef(
      (
        { value, onChange, disabled, isDisabled, placeholder, onKeyPress, onKeyDown }: any,
        ref: any
      ) =>
        React.createElement("textarea", {
          ref,
          value,
          onChange,
          placeholder,
          onKeyPress,
          onKeyDown,
          disabled: disabled || isDisabled || undefined,
        })
    ),
    Select: makeEl("select"),
    FormControl: makeEl("div"),
    FormLabel: makeEl("label"),
    FormErrorMessage: makeEl("span"),
    FormHelperText: makeEl("span"),
    Tooltip: ({ children }: any) => children ?? null,
    Skeleton: ({ children }: any) => React.createElement("div", null, children),
    Collapse,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    useDisclosure,
    useColorModeValue: (light: any) => light,
    useToast: () => jest.fn(),
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === "object")
        return vals.base ?? vals.sm ?? vals.md ?? Object.values(vals)[0];
      return vals;
    },
    extendTheme: (t: any) => t,
    createStandaloneToast: () => ({ toast: jest.fn() }),
    useMultiStyleConfig: () => ({}),
    StylesProvider: ({ children }: any) => children,
    useStyles: () => ({}),
  };

  return new Proxy(known, {
    get(target, prop) {
      if (prop in target) return Reflect.get(target, prop);
      if (typeof prop === "string") {
        if (prop.startsWith("use")) {
          if (!cache[`hook:${prop}`]) cache[`hook:${prop}`] = () => ({});
          return cache[`hook:${prop}`];
        }
        return makeEl("div");
      }
      return Reflect.get(target, prop);
    },
  });
});

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { AllJobsTab } from "@/components/AllJobsTab";
import type { User } from "@/types/User";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VERIFIED_USER: User = {
  id: "user123",
  name: "Test User",
  email: "test@example.com",
  phone: null,
  currentLocation: null,
  createdAt: new Date("2024-01-01"),
  resume: {
    summary: "Engineer",
    skills: ["TypeScript"],
    experience: [],
    education: [],
    certifications: [],
    languages: [],
    projects: [],
    achievements: [],
    volunteerExperience: [],
    interests: [],
  },
  isVerified: true,
  answeredQuestionsCount: 0,
  preferences: {
    jobTypes: [],
    location: [],
    remoteOnly: false,
    minSalary: 0,
    industries: [],
    minScore: 30,
    matchingEnabled: false,
  },
};

// CRITICAL INVARIANT: jobId and matchId are DELIBERATELY DISTINCT.
// A bug that passes job._id instead of match._id must fail criterion-2 tests.
const JOB_A_ID = "job-listing-aaa";
const MATCH_A_ID = "match-record-aaa"; // ≠ JOB_A_ID
const JOB_B_ID = "job-listing-bbb";
const MATCH_B_ID = "match-record-bbb"; // ≠ JOB_B_ID
const UNMATCHED_JOB_ID = "job-listing-unmatched-001";
const NEW_MATCH_ID = "match-record-on-demand-999"; // returned by matchJobOnDemand

const makeMatchedJob = (jobId: string, matchId: string) => ({
  _id: jobId,
  title: `Job ${jobId}`,
  company: "Acme Corp",
  location: ["Remote"],
  salary: { min: 100000, max: 150000, currency: "USD", estimated: false },
  tags: ["React"],
  source: "linkedin",
  description: `Description for ${jobId}`,
  url: `https://example.com/${jobId}`,
  postedDate: "2026-01-01T00:00:00Z",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  scrapedDate: "2026-01-01",
  match: {
    _id: matchId, // MatchRecord id — DIFFERENT from jobId
    matchScore: 85,
    verdict: "good",
    reasoning: "Strong match",
    clicked: false,
    skipped: false,
    applied: null,
    userId: "user123",
    jobId,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
});

const makeUnmatchedJob = (jobId: string) => ({
  _id: jobId,
  title: `Unmatched Job ${jobId}`,
  company: "Beta Ltd",
  location: ["Remote"],
  salary: { min: 80000, max: 120000, currency: "USD", estimated: false },
  tags: [],
  source: "indeed",
  description: `Unmatched description for ${jobId}`,
  url: `https://example.com/unmatched/${jobId}`,
  postedDate: "2026-01-01T00:00:00Z",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  scrapedDate: "2026-01-01",
  match: null,
});

const JOB_A = makeMatchedJob(JOB_A_ID, MATCH_A_ID);
const JOB_B = makeMatchedJob(JOB_B_ID, MATCH_B_ID);
const UNMATCHED_JOB = makeUnmatchedJob(UNMATCHED_JOB_ID);

const ONE_MATCHED = { jobs: [JOB_A], total: 1, page: 1, pages: 1, sources: ["linkedin"] };
const TWO_MATCHED = { jobs: [JOB_A, JOB_B], total: 2, page: 1, pages: 1, sources: ["linkedin"] };
const ONE_UNMATCHED = { jobs: [UNMATCHED_JOB], total: 1, page: 1, pages: 1, sources: ["indeed"] };
const MIXED = { jobs: [UNMATCHED_JOB, JOB_A], total: 2, page: 1, pages: 1, sources: ["linkedin", "indeed"] };

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockGetAllJobs = jest.fn().mockResolvedValue(ONE_MATCHED);
  mockCreateOrGetJobConversation = jest.fn().mockResolvedValue({
    conversationId: "conv-1",
    messages: [],
  });
  mockMatchJobOnDemand = jest.fn().mockResolvedValue({
    success: true,
    match: {
      _id: NEW_MATCH_ID,
      matchScore: 72,
      verdict: "good",
      reasoning: "On-demand match",
      clicked: false,
      skipped: false,
      applied: null,
      userId: "user123",
      jobId: UNMATCHED_JOB_ID,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  });
  mockMarkMatchAsSkipped = jest.fn().mockResolvedValue({ success: true });
  mockOpenJobQuestionsDrawer = jest.fn();
  jest.spyOn(window, "open").mockImplementation(() => null);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const renderTab = (props: Partial<React.ComponentProps<typeof AllJobsTab>> = {}) =>
  render(
    <AllJobsTab
      user={VERIFIED_USER}
      walletBalance={1.0}
      openJobQuestionsDrawer={mockOpenJobQuestionsDrawer}
      onApplyClick={jest.fn()}
      onBalanceChange={jest.fn()}
      {...props}
    />
  );

/** Wait for the initial getAllJobs fetch to complete (spinner disappears). */
const waitForJobs = async () => {
  await waitFor(
    () => expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    { timeout: 3000 }
  );
};

/** Return all "More" buttons visible in the DOM right now. */
const findMoreButtons = (): HTMLButtonElement[] =>
  Array.from(document.querySelectorAll("button")).filter(
    (b) => /^more$/i.test(b.textContent?.trim() ?? "")
  ) as HTMLButtonElement[];

// ══════════════════════════════════════════════════════════════════════════════
// 1. NO_EAGER_MOUNT
//
// Rendering matched cards makes ZERO createOrGetJobConversation calls before
// any "More" button is clicked. JobChatSection must not mount eagerly.
// A bug here: chat is initialized on every visible card, burning 1 POST per job
// on every page load/scroll before the user ever opens a card.
// ══════════════════════════════════════════════════════════════════════════════

describe("1 — NO_EAGER_MOUNT: zero calls before any card is expanded", () => {
  it("one matched job: zero createOrGetJobConversation calls after initial render", async () => {
    mockGetAllJobs.mockResolvedValue(ONE_MATCHED);
    renderTab();
    await waitForJobs();
    await act(async () => {});

    // FINDING: any call > 0 means JobChatSection mounted eagerly without user action
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(0);
  });

  it("five matched jobs: still zero calls — not one per visible card", async () => {
    const fiveJobs = {
      jobs: [
        makeMatchedJob("job-1", "match-1"),
        makeMatchedJob("job-2", "match-2"),
        makeMatchedJob("job-3", "match-3"),
        makeMatchedJob("job-4", "match-4"),
        makeMatchedJob("job-5", "match-5"),
      ],
      total: 5, page: 1, pages: 1, sources: ["linkedin"],
    };
    mockGetAllJobs.mockResolvedValue(fiveJobs);
    renderTab();
    await waitForJobs();
    await act(async () => {});

    // FINDING: called N times (one per card) — eager mount at render
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(0);
  });

  it("zero calls even after multiple re-renders of the tab", async () => {
    mockGetAllJobs.mockResolvedValue(ONE_MATCHED);
    const { rerender } = renderTab();
    await waitForJobs();
    await act(async () => {});

    rerender(
      <AllJobsTab
        user={VERIFIED_USER}
        walletBalance={1.5}
        openJobQuestionsDrawer={mockOpenJobQuestionsDrawer}
        onApplyClick={jest.fn()}
        onBalanceChange={jest.fn()}
      />
    );
    await act(async () => {});

    // FINDING: re-render triggered createOrGetJobConversation — effect not guarded
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. EXPAND_MATCHED_RIGHT_ID
//
// Expanding a matched card:
//   a) calls createOrGetJobConversation exactly once
//   b) calls it with job.match._id — NOT job._id
//
// The fixture has DISTINCT job._id and match._id. Any bug that passes job._id
// instead of match._id will fail the args assertion.
// ══════════════════════════════════════════════════════════════════════════════

describe("2 — EXPAND_MATCHED_RIGHT_ID: one call with match._id on More click", () => {
  it("sanity: fixture has distinct job._id and match._id", () => {
    // Prerequisite: if these were equal the id-correctness assertion would be vacuous
    expect(JOB_A_ID).not.toBe(MATCH_A_ID);
    expect(JOB_B_ID).not.toBe(MATCH_B_ID);
  });

  it("clicking More fires exactly ONE createOrGetJobConversation call", async () => {
    mockGetAllJobs.mockResolvedValue(ONE_MATCHED);
    renderTab();
    await waitForJobs();

    const moreBtns = findMoreButtons();
    // FINDING: no More button rendered for matched job
    expect(moreBtns.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(moreBtns[0]);

    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    );

    // Allow extra time to confirm no double-fire
    await new Promise((r) => setTimeout(r, 150));

    // FINDING: more than 1 call — double-mount or double-effect bug
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(1);
  });

  it("call arg is match._id (MATCH_A_ID) — not job._id (JOB_A_ID)", async () => {
    mockGetAllJobs.mockResolvedValue(ONE_MATCHED);
    renderTab();
    await waitForJobs();

    const moreBtns = findMoreButtons();
    expect(moreBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(moreBtns[0]);

    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalled(),
      { timeout: 3000 }
    );

    const arg = mockCreateOrGetJobConversation.mock.calls[0][0];

    // FINDING: arg is undefined — matchId was not threaded through aiSection wiring
    expect(arg).toBeDefined();
    // FINDING: arg is null — matchId explicitly set to null
    expect(arg).not.toBeNull();
    // FINDING: arg is JOB_A_ID — implementation used job._id instead of job.match._id
    expect(arg).not.toBe(JOB_A_ID);
    // FINDING: arg is something else entirely (sibling id, hardcoded string, etc.)
    expect(arg).toBe(MATCH_A_ID);
  });

  it("call arg is specifically the MatchRecord id string, not the JobListing id", async () => {
    // Belt-and-suspenders: verify the two ids are what they appear
    expect(MATCH_A_ID).toBe("match-record-aaa");
    expect(JOB_A_ID).toBe("job-listing-aaa");

    mockGetAllJobs.mockResolvedValue(ONE_MATCHED);
    renderTab();
    await waitForJobs();

    fireEvent.click(findMoreButtons()[0]);

    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalled(),
      { timeout: 3000 }
    );

    const arg = mockCreateOrGetJobConversation.mock.calls[0][0];

    // FINDING: arg contains "job-listing" — implementation passed the JobListing _id
    expect(arg).not.toMatch(/job-listing/);
    // FINDING: arg contains "match-record" — correct; fails if job._id was used
    expect(arg).toMatch(/match-record/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. UNMATCHED_NO_CHAT
//
// Unmatched cards (match === null) must never trigger createOrGetJobConversation,
// regardless of user interaction. No chat element should be present.
// ══════════════════════════════════════════════════════════════════════════════

describe("3 — UNMATCHED_NO_CHAT: unmatched card has no chat, zero calls", () => {
  it("page with only unmatched jobs: zero createOrGetJobConversation calls after load", async () => {
    mockGetAllJobs.mockResolvedValue(ONE_UNMATCHED);
    renderTab();
    await waitForJobs();
    await act(async () => {});

    // FINDING: called even though no matched job was rendered
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(0);
  });

  it("mixed page (one unmatched, one matched): zero calls before any More click", async () => {
    mockGetAllJobs.mockResolvedValue(MIXED);
    renderTab();
    await waitForJobs();
    await act(async () => {});

    // FINDING: unmatched card triggered createOrGetJobConversation on render
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(0);
  });

  it("no createOrGetJobConversation call even if user interacts with the unmatched card area", async () => {
    mockGetAllJobs.mockResolvedValue(ONE_UNMATCHED);
    renderTab();
    await waitForJobs();
    await act(async () => {});

    // Simulate clicking any buttons in the unmatched card (not the match action)
    const buttons = Array.from(document.querySelectorAll("button")).filter((b) =>
      !/score|match for me|match this/i.test(b.textContent ?? "")
    );
    buttons.slice(0, 3).forEach((b) => {
      try { fireEvent.click(b); } catch { /* ignore render errors from unrelated actions */ }
    });

    await act(async () => {});

    // FINDING: clicking the unmatched card's buttons triggered a chat call
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. SIBLING_ISOLATION
//
// Multiple matched cards must each use their OWN match._id.
// A shared ref, closure over first id, or array-index mistake would fail these.
// ══════════════════════════════════════════════════════════════════════════════

describe("4 — SIBLING_ISOLATION: each card uses its own match._id", () => {
  it("opening card B uses MATCH_B_ID, not MATCH_A_ID", async () => {
    mockGetAllJobs.mockResolvedValue(TWO_MATCHED);
    renderTab();
    await waitForJobs();
    await act(async () => {});

    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(0);

    const moreBtns = findMoreButtons();
    // Two matched jobs should produce two More buttons
    expect(moreBtns.length).toBeGreaterThanOrEqual(2);

    // Click the SECOND card's More button (card B)
    fireEvent.click(moreBtns[1]);

    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    );

    const arg = mockCreateOrGetJobConversation.mock.calls[0][0];

    // FINDING: arg is MATCH_A_ID — sibling A's id bled into B's chat
    expect(arg).not.toBe(MATCH_A_ID);
    // FINDING: arg is JOB_B_ID — job id used instead of match id for card B
    expect(arg).not.toBe(JOB_B_ID);
    // FINDING: arg is JOB_A_ID — wrong card's job id used
    expect(arg).not.toBe(JOB_A_ID);
    // Expected: card B's match id
    expect(arg).toBe(MATCH_B_ID);
  });

  it("opening A then B produces calls [MATCH_A_ID, MATCH_B_ID] — no id bleed", async () => {
    mockGetAllJobs.mockResolvedValue(TWO_MATCHED);
    renderTab();
    await waitForJobs();
    await act(async () => {});

    const moreBtns = findMoreButtons();
    expect(moreBtns.length).toBeGreaterThanOrEqual(2);

    // Open card A
    fireEvent.click(moreBtns[0]);
    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    );
    // FINDING: first call used wrong id
    expect(mockCreateOrGetJobConversation.mock.calls[0][0]).toBe(MATCH_A_ID);

    // Open card B
    fireEvent.click(moreBtns[1]);
    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(2),
      { timeout: 3000 }
    );
    // FINDING: second call used MATCH_A_ID again — sibling isolation broken
    expect(mockCreateOrGetJobConversation.mock.calls[1][0]).toBe(MATCH_B_ID);
  });

  it("three distinct cards: each opened independently, each uses its own match id", async () => {
    const JOB_C_ID = "job-listing-ccc";
    const MATCH_C_ID = "match-record-ccc";
    const threeJobs = {
      jobs: [JOB_A, JOB_B, makeMatchedJob(JOB_C_ID, MATCH_C_ID)],
      total: 3, page: 1, pages: 1, sources: ["linkedin"],
    };
    const expectedMatchIds = [MATCH_A_ID, MATCH_B_ID, MATCH_C_ID];

    mockGetAllJobs.mockResolvedValue(threeJobs);
    renderTab();
    await waitForJobs();
    await act(async () => {});

    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(0);

    const moreBtns = findMoreButtons();
    expect(moreBtns.length).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < 3; i++) {
      fireEvent.click(moreBtns[i]);
      await waitFor(
        () => expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(i + 1),
        { timeout: 3000 }
      );
      const arg = mockCreateOrGetJobConversation.mock.calls[i][0];
      // FINDING: call[i] used the wrong match id
      expect(arg).toBe(expectedMatchIds[i]);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. AFTER_ON_DEMAND_MATCH
//
// An unmatched card that the user "scores" via matchJobOnDemand gains a match.
// After the match resolves, expanding the card must call createOrGetJobConversation
// with the NEW match._id returned from matchJobOnDemand — NOT the original job._id,
// NOT a stale id, NOT undefined.
// ══════════════════════════════════════════════════════════════════════════════

describe("5 — AFTER_ON_DEMAND_MATCH: new match._id used after on-demand match", () => {
  it("after matchJobOnDemand resolves, expanding card uses the new match._id", async () => {
    mockGetAllJobs.mockResolvedValue(ONE_UNMATCHED);
    renderTab();
    await waitForJobs();
    await act(async () => {});

    // Confirm no calls yet
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(0);

    // Find the on-demand match button in the unmatched card.
    // DOM inspection during first run revealed the button says "Analyze ($0.05)".
    // Search pattern covers this and plausible alternatives.
    const matchBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      /analyze|score|match.*job|match.*me|for me/i.test(b.textContent ?? b.getAttribute("aria-label") ?? "")
    );

    // HARD ASSERTION: the on-demand-match control must be present and clickable.
    // FINDING if this fails: pattern /analyze|score|match.*job|match.*me|for me/i matched no button —
    // the on-demand-match -> matched -> chat flow cannot proceed.
    expect(matchBtn).toBeDefined();
    expect(matchBtn).not.toBeNull();

    // Click the on-demand match button (! is safe: we hard-asserted above)
    fireEvent.click(matchBtn!);

    // Wait for matchJobOnDemand to have been called
    await waitFor(
      () => expect(mockMatchJobOnDemand).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    );

    // matchJobOnDemand should be called with the job._id (JobListing id, not match id)
    expect(mockMatchJobOnDemand.mock.calls[0][0]).toBe(UNMATCHED_JOB_ID);

    // Wait for the component to re-render as matched
    await act(async () => {});
    await act(async () => {});

    // The card should now show as matched — More button should appear
    const moreBtnsAfterMatch = findMoreButtons();

    // HARD ASSERTION: after matchJobOnDemand resolves, the card must re-render as matched
    // and show a More button. FINDING if this fails: state was not updated with the new match —
    // the on-demand-match flow does not produce a chat-expandable card.
    expect(moreBtnsAfterMatch.length).toBeGreaterThanOrEqual(1);

    // Expand the now-matched card
    fireEvent.click(moreBtnsAfterMatch[0]);

    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    );

    const arg = mockCreateOrGetJobConversation.mock.calls[0][0];

    // FINDING: called with the original job._id (UNMATCHED_JOB_ID) instead of the new match._id
    expect(arg).not.toBe(UNMATCHED_JOB_ID);
    // FINDING: called with undefined — new match._id not threaded into aiSection after state update
    expect(arg).toBeDefined();
    expect(arg).not.toBeNull();
    // FINDING: called with something other than the new match id returned by matchJobOnDemand
    expect(arg).toBe(NEW_MATCH_ID);
  });

  it("matchJobOnDemand is called with job._id (not match._id or undefined)", async () => {
    mockGetAllJobs.mockResolvedValue(ONE_UNMATCHED);
    renderTab();
    await waitForJobs();
    await act(async () => {});

    const matchBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      /analyze|score|match.*job|match.*me|for me/i.test(b.textContent ?? b.getAttribute("aria-label") ?? "")
    );

    // HARD ASSERTION: on-demand-match control must be present.
    expect(matchBtn).toBeDefined();
    expect(matchBtn).not.toBeNull();

    fireEvent.click(matchBtn!); // ! is safe: hard-asserted above

    await waitFor(
      () => expect(mockMatchJobOnDemand).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    );

    const callArg = mockMatchJobOnDemand.mock.calls[0][0];
    // FINDING: wrong argument passed — should be jobId of the unmatched job
    expect(callArg).toBe(UNMATCHED_JOB_ID);
    expect(callArg).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. EXISTING_FLOWS_UNCHANGED
//
// Adding aiSection to matched JobListing cards must not break existing behaviors:
//   - openJobQuestionsDrawer is still callable from matched cards
//   - Skip action still works on matched cards
//   - Source filter and pagination controls are still present
// ══════════════════════════════════════════════════════════════════════════════

describe("6 — EXISTING_FLOWS: prior AllJobsTab behaviors unaffected by aiSection", () => {
  it("skip button on matched card still calls markMatchAsSkipped (not createOrGetJobConversation)", async () => {
    mockGetAllJobs.mockResolvedValue(ONE_MATCHED);
    renderTab();
    await waitForJobs();
    await act(async () => {});

    // HARD ASSERTION: Skip button must be present — missing it is a test failure, not a silent pass.
    const skipBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Skip"
    );
    expect(skipBtn).toBeTruthy();

    // Open the skip modal
    fireEvent.click(skipBtn!);
    await act(async () => {});

    // Select a reason inside the modal
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    const reasonBtn = Array.from(dialog!.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Salary too low"
    );
    expect(reasonBtn).toBeTruthy();
    fireEvent.click(reasonBtn!);
    await act(async () => {});

    // Submit the skip
    const submitBtn = Array.from(dialog!.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Skip Job"
    );
    expect(submitBtn).toBeTruthy();
    fireEvent.click(submitBtn!);
    await act(async () => {});

    // markMatchAsSkipped must be called with the correct match id and selected reason
    expect(mockMarkMatchAsSkipped).toHaveBeenCalledTimes(1);
    expect(mockMarkMatchAsSkipped).toHaveBeenCalledWith(MATCH_A_ID, "salary", undefined);

    // FINDING: clicking skip triggered a chat conversation call
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(0);
  });

  it("expanding matched card and THEN clicking skip does not produce extra chat calls", async () => {
    mockGetAllJobs.mockResolvedValue(ONE_MATCHED);
    renderTab();
    await waitForJobs();
    await act(async () => {});

    const moreBtns = findMoreButtons();
    expect(moreBtns.length).toBeGreaterThan(0);

    // Expand card
    fireEvent.click(moreBtns[0]);
    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    );

    const countAfterExpand = mockCreateOrGetJobConversation.mock.calls.length;

    // HARD ASSERTION: Skip button must be present — missing it is a test failure, not a silent pass.
    const skipBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Skip"
    );
    expect(skipBtn).toBeTruthy();

    // Complete the full skip flow: open modal, select reason, submit
    fireEvent.click(skipBtn!);
    await act(async () => {});

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    const reasonBtn = Array.from(dialog!.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Salary too low"
    );
    expect(reasonBtn).toBeTruthy();
    fireEvent.click(reasonBtn!);
    await act(async () => {});

    const submitBtn = Array.from(dialog!.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Skip Job"
    );
    expect(submitBtn).toBeTruthy();
    fireEvent.click(submitBtn!);
    await act(async () => {});

    // FINDING: skipping after expansion triggered another conversation call
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(countAfterExpand);
  });

  it("getAllJobs is called once on mount, with page=1", async () => {
    mockGetAllJobs.mockResolvedValue(ONE_MATCHED);
    renderTab();
    await waitForJobs();

    // FINDING: getAllJobs not called, or called with wrong args
    expect(mockGetAllJobs).toHaveBeenCalledTimes(1);
    expect(mockGetAllJobs.mock.calls[0][0]).toBe(1); // page 1
  });

  // openJobQuestionsDrawer tautological test DELETED.
  // The prior test called the mock directly and asserted it was called — proving nothing about
  // production wiring. The button that actually triggers openJobQuestionsDrawer in JobListing
  // cannot be identified without reading the forbidden implementation files (the "Apply" <a>
  // found in DOM is the external job link, not the questions drawer opener). The apply flow is
  // covered by other suites (kda-a.allJobs.adversarial, existing JobListing tests).
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. FAILURE_ISOLATION
//
// If createOrGetJobConversation rejects or resolves {error}, the browse page
// must not crash. The card and page must remain usable (visible, closable).
// JobChatSection is expected to handle errors internally and show its own UI.
// ══════════════════════════════════════════════════════════════════════════════

describe("7 — FAILURE_ISOLATION: chat API errors don't crash the browse page", () => {
  it("rejected createOrGetJobConversation: page does not crash on More click", async () => {
    mockCreateOrGetJobConversation.mockRejectedValue(new Error("Network error"));
    mockGetAllJobs.mockResolvedValue(ONE_MATCHED);
    renderTab();
    await waitForJobs();

    const moreBtns = findMoreButtons();
    expect(moreBtns.length).toBeGreaterThan(0);

    // Should not throw at the click boundary
    expect(() => fireEvent.click(moreBtns[0])).not.toThrow();

    // Allow the rejection to propagate
    await act(async () => {});
    await act(async () => {});

    // FINDING: page crashed — entire browse list disappeared
    // The matched job title should still be in the document
    const body = document.body.textContent ?? "";
    expect(body.includes(`Job ${JOB_A_ID}`) || body.includes("Acme Corp")).toBe(true);
  });

  it("resolved {error} from createOrGetJobConversation: page remains stable", async () => {
    mockCreateOrGetJobConversation.mockResolvedValue({ error: "Conversation unavailable" });
    mockGetAllJobs.mockResolvedValue(ONE_MATCHED);
    renderTab();
    await waitForJobs();

    const moreBtns = findMoreButtons();
    expect(moreBtns.length).toBeGreaterThan(0);

    expect(() => fireEvent.click(moreBtns[0])).not.toThrow();

    await act(async () => {});
    await act(async () => {});

    // FINDING: {error} response caused page to blank out
    const body = document.body.textContent ?? "";
    expect(
      body.includes(`Job ${JOB_A_ID}`) || body.includes("Acme Corp")
    ).toBe(true);
  });

  it("chat error in one card does not prevent a different card from being expanded", async () => {
    // First call rejects; second call succeeds — isolates error to the first card
    mockCreateOrGetJobConversation
      .mockRejectedValueOnce(new Error("First card error"))
      .mockResolvedValue({ conversationId: "conv-2", messages: [] });

    mockGetAllJobs.mockResolvedValue(TWO_MATCHED);
    renderTab();
    await waitForJobs();

    const moreBtns = findMoreButtons();
    expect(moreBtns.length).toBeGreaterThanOrEqual(2);

    // Expand card A — will error
    fireEvent.click(moreBtns[0]);
    await act(async () => {});
    await act(async () => {});

    // Expand card B — should succeed even though card A errored
    fireEvent.click(moreBtns[1]);
    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(2),
      { timeout: 3000 }
    );

    // FINDING: second card's conversation not initiated — error from first card blocked it
    const secondArg = mockCreateOrGetJobConversation.mock.calls[1][0];
    expect(secondArg).toBe(MATCH_B_ID);
  });

  it("session-expiry error from createOrGetJobConversation does not crash page", async () => {
    mockCreateOrGetJobConversation.mockRejectedValue(new Error("Session expired"));
    mockGetAllJobs.mockResolvedValue(ONE_MATCHED);
    renderTab();
    await waitForJobs();

    const moreBtns = findMoreButtons();
    expect(moreBtns.length).toBeGreaterThan(0);

    expect(() => fireEvent.click(moreBtns[0])).not.toThrow();
    await act(async () => {});
    await act(async () => {});

    // Page must still have content
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DISCLOSURE
//
// FILES READ (permitted by adversarial-author rules):
//   src/__tests__/7j3.browse-chat.smoke.test.tsx
//     — JobListing import path, prop interface (job, openJobQuestionsDrawer, aiSection)
//     — "More" / "Less" button text confirmed as the expand/collapse trigger
//     — JobResult fixture shape (matched card): _id = MatchRecord id, job._id = JobListing id
//     — Chakra UI mock pattern (useDisclosure with real useState)
//     — MatchScoreRing and AIReasoningBox mocked to null
//   src/__tests__/kda-a.allJobs.adversarial.test.tsx
//     — AllJobsTab import path: @/components/AllJobsTab (named export)
//     — AllJobsTab props: user, walletBalance, openJobQuestionsDrawer, onApplyClick, onBalanceChange
//     — RawJob fixture shape and match field structure (match: null vs match: { _id, matchScore, ... })
//     — getAllJobs response shape: { jobs, total, page, pages, sources }
//     — DISCLOSURE from that test: AllJobsTab.tsx line numbers for isSafeUrl, getAllJobs, View button
//     — Security-aware Button mock (href → <a>)
//     — AuthContext mock shape
//     — react-icons comprehensive list for AllJobsTab
//     — OutOfCreditPreview mock shape
//     — CRITICAL: kda-a mocks JobListing to null; I do NOT mock it (need real More toggle)
//   src/__tests__/8of.today-jobchat.adversarial.test.tsx
//     — Comprehensive Chakra mock including Collapse, Drawer, Modal
//     — nullIconProxy pattern for react-icon stubs (adapted to inline factories)
//     — @emotion/react mock pattern
//     — @/theme/theme mock shape
//     — @/utils/brief-utils mock (isSafeUrl, getOddsLine, getOddsColor)
//     — @/utils/text-formatter mock
//   src/__tests__/tqx.session-expiry.adversarial.test.tsx
//     — JobChatSection import path: @/components/Dashboard/JobChatSection
//     — Chakra icon mock patterns
//   src/__tests__/78n.jobchat.smoke.test.tsx
//     — JobChatSection prop: { matchId: string }
//     — Spinner renders as role="status" (used in waitForJobs helper)
//   src/lib/apiClient.ts
//     — createOrGetJobConversation signature: (matchId: string) => Promise<...>
//     — getAllJobs signature: (page: number, source?: string) => Promise<{ jobs, ... }>
//     — matchJobOnDemand signature: (jobId: string) => Promise<{ success, match } | throws>
//   src/types/User.ts
//     — User type shape
//
// FILES NOT OPENED (forbidden):
//   src/components/AllJobsTab.tsx    ✓ NOT opened
//   src/components/Dashboard/JobListing.tsx    ✓ NOT opened
//
// INCIDENTAL DISCLOSURES:
//   From kda-a.allJobs.adversarial.test.tsx DISCLOSURE comments:
//   - AllJobsTab.tsx line numbers (27-46, 122, 325, 404-416) seen in the DISCLOSURE comment
//     of another test file. HOW AVOIDED: assertions target observable DOM behavior, not
//     internal variable names or line-specific logic.
//   - RawJob.match shape (has _id, matchScore, verdict, etc.) seen in kda-a fixture code.
//     HOW AVOIDED: fixture shape inferred from contract description (the match object has _id).
//
// UNTESTABLE-WITHOUT-READING (findings):
//   1. On-demand match button text: the "match this job" control in unmatched JobCard cannot
//      be reliably found without reading AllJobsTab.tsx's inline JobCard definition. Test 5
//      uses broad text search (/score|match.*job|match.*me|for me/i) and falls back gracefully
//      rather than false-passing. If the button label differs, the test is inconclusive.
//   2. Collapse vs conditional render: the Collapse mock gates children on `in` prop. If
//      AllJobsTab/JobListing uses CSS visibility instead of Collapse for the More toggle,
//      and the child mounts regardless, criterion 1 would be a false pass. Cannot verify
//      the exact gating mechanism without reading JobListing.tsx.
//   3. More button label: the smoke test confirmed "More" / "Less" text. This test relies
//      on that same observable label. If the label changed, findMoreButtons() would return
//      an empty array and criteria 2-4 would produce no useful assertions. The helper's
//      pre-assertion `expect(moreBtns.length).toBeGreaterThanOrEqual(1)` surfaces this.
//   4. Whether AllJobsTab creates <JobChatSection matchId={job.match._id} /> vs
//      passes job._id instead: the whole point of criterion 2. Cannot pre-determine;
//      the test exposes it at runtime.
// ══════════════════════════════════════════════════════════════════════════════
