/**
 * Smoke tests for onlyjobs-oaq: follow-up email deep-link wizard.
 *
 * Oracle: onlyjobs-oaq spec — opening the link opens the wizard but does NOT
 * auto-record any outcome; outcomes are recorded ONLY on explicit user
 * selection via the existing authed POST /matches/:id/outcome.
 *
 * DISCLOSURE — files read while writing mocks:
 *   - tracker.tsx: state management, wizard open conditions, param stripping via
 *     router.replace, followupTriggered ref guard.
 *   - FollowUpWizardModal.tsx: OUTCOME_OPTIONS keys and labels (public contract).
 *   - tracker-utils.ts: shouldShowFollowUp signature (applied + no outcome + 14+ days).
 *   - tracker.test.tsx: Chakra mock pattern copied verbatim.
 * No assertions encode implementation internals — only user-visible contract
 * strings and state transitions from the spec.
 */

// ─── Mock control variables ───────────────────────────────────────────────────
let mockSearchParamsValue: URLSearchParams;
let mockAuthState: { isReady: boolean; isLoggedIn: boolean };
let mockGetTracker: jest.Mock;
let mockRecordApplicationOutcome: jest.Mock;
const mockPush = jest.fn();
const mockReplace = jest.fn();

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => "/tracker",
  useSearchParams: () => mockSearchParamsValue,
}));

jest.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
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

// Chakra UI — same comprehensive mock as tracker.test.tsx
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
          type,
          disabled,
          "aria-label": al,
          href,
          role,
          ...rest
        }: any,
        ref: any
      ) =>
        React.createElement(
          tag,
          { ref, onClick, type, disabled, "aria-label": al, href, role },
          children
        )
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };
  const known: Record<string, any> = {
    __esModule: true,
    ChakraProvider: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    Box: makeEl("div"),
    Flex: makeEl("div"),
    VStack: makeEl("div"),
    HStack: makeEl("div"),
    Stack: makeEl("div"),
    SimpleGrid: makeEl("div"),
    Wrap: makeEl("div"),
    WrapItem: makeEl("div"),
    Container: makeEl("div"),
    Center: makeEl("div"),
    Grid: makeEl("div"),
    GridItem: makeEl("div"),
    Text: makeEl("span"),
    Heading: makeEl("h3"),
    Button: makeEl("button"),
    IconButton: ({ "aria-label": al, onClick, children }: any) =>
      React.createElement("button", { "aria-label": al, onClick }, children ?? null),
    Link: ({ children, href, onClick }: any) =>
      React.createElement("a", { href, onClick }, children),
    Badge: makeEl("span"),
    Tag: makeEl("span"),
    TagLabel: ({ children }: any) => React.createElement("span", null, children),
    Divider: () => React.createElement("hr"),
    Spinner: () =>
      React.createElement("div", { role: "status", "aria-label": "Loading" }),
    Alert: makeEl("div"),
    AlertIcon: () => null,
    AlertTitle: makeEl("span"),
    AlertDescription: makeEl("span"),
    Modal: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    ModalOverlay: ({ children }: any) =>
      React.createElement("div", null, children),
    ModalContent: ({ children }: any) =>
      React.createElement("div", { role: "dialog" }, children),
    ModalHeader: ({ children }: any) =>
      React.createElement("h2", null, children),
    ModalBody: ({ children }: any) =>
      React.createElement("div", null, children),
    ModalFooter: ({ children }: any) =>
      React.createElement("div", null, children),
    ModalCloseButton: ({ onClick }: any) =>
      React.createElement("button", { onClick }, "Close"),
    useColorModeValue: (light: any) => light,
    useDisclosure: () => {
      const [isOpen, setIsOpen] = React.useState(false);
      return {
        isOpen,
        onOpen: () => setIsOpen(true),
        onClose: () => setIsOpen(false),
        onToggle: () => setIsOpen((v: boolean) => !v),
      };
    },
    useToast: () => jest.fn(),
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === "object") {
        return vals.base ?? vals.sm ?? vals.md ?? Object.values(vals)[0];
      }
      return vals;
    },
    extendTheme: (t: any) => t,
    createStandaloneToast: () => ({ toast: jest.fn() }),
    useMultiStyleConfig: () => ({}),
    StylesProvider: ({ children }: any) => children,
    useStyles: () => ({}),
    Select: makeEl("select"),
    Textarea: makeEl("textarea"),
    Input: makeEl("input"),
    FormControl: makeEl("div"),
    FormLabel: makeEl("label"),
    Tooltip: ({ children }: any) => children,
    Menu: ({ children }: any) => React.createElement(React.Fragment, null, children),
    MenuButton: makeEl("button"),
    MenuList: ({ children }: any) =>
      React.createElement("ul", { role: "menu" }, children),
    MenuItem: ({ children, onClick }: any) =>
      React.createElement("li", { role: "menuitem", onClick }, children),
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

jest.mock("@/theme/theme", () => ({ __esModule: true, default: {} }));

jest.mock("@/components/Layout/DashboardLayout", () => ({
  __esModule: true,
  default: ({ children }: any) =>
    React.createElement(React.Fragment, null, children),
}));

jest.mock("@/components/SEO", () => ({
  __esModule: true,
  SEO: () => null,
}));

jest.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => mockAuthState,
}));

jest.mock("@/lib/apiClient", () => ({
  __esModule: true,
  createApiClient: () => ({
    getTracker: (...args: any[]) => mockGetTracker(...args),
    recordApplicationOutcome: (...args: any[]) =>
      mockRecordApplicationOutcome(...args),
    touchSession: jest.fn().mockResolvedValue(undefined),
    getUserProfile: jest.fn().mockResolvedValue(null),
    getMatches: jest.fn().mockResolvedValue([]),
  }),
}));

// ─── Imports (after jest.mock declarations) ───────────────────────────────────

import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
  act,
} from "@testing-library/react";
import TrackerPage from "@/pages/tracker";
import type { JobResult } from "@/types/JobResult";
import type { Job } from "@/types/Job";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number): string =>
  new Date(Date.now() - n * MS_PER_DAY).toISOString();

let _seq = 0;
const uid = () => `id-${++_seq}`;

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  _id: uid(),
  title: "Test Job",
  company: "TestCo",
  location: [],
  salary: { min: 0, max: 0, currency: "USD", estimated: false },
  tags: [],
  source: "test",
  description: "desc",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  postedDate: new Date().toISOString(),
  scrapedDate: new Date().toISOString(),
  url: "https://example.com/job",
  ...overrides,
});

const makeTrackerJob = (overrides: Partial<JobResult> = {}): JobResult => ({
  _id: uid(),
  userId: "u1",
  jobId: uid(),
  matchScore: 80,
  verdict: "good",
  reasoning: "ok",
  clicked: false,
  skipped: false,
  applied: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  job: makeJob(),
  ...overrides,
});

const renderAndWait = async () => {
  const result = render(<TrackerPage />);
  await waitFor(
    () => expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    { timeout: 3000 }
  );
  return result;
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  _seq = 0;
  mockSearchParamsValue = new URLSearchParams();
  mockAuthState = { isReady: true, isLoggedIn: true };
  mockGetTracker = jest.fn().mockResolvedValue([]);
  mockRecordApplicationOutcome = jest.fn().mockResolvedValue({ message: "ok" });
  mockPush.mockReset();
  mockReplace.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. ?followup=true opens wizard over eligible apps
// ══════════════════════════════════════════════════════════════════════════════

describe("1 — ?followup=true opens wizard when eligible apps exist", () => {
  it("renders the wizard dialog for a stale applied job (14+ days, no outcome)", async () => {
    mockSearchParamsValue = new URLSearchParams("followup=true");
    const job = makeTrackerJob({
      job: makeJob({ title: "Stale Job", company: "StaleCo" }),
      applicationOutcome: undefined,
      appliedAt: daysAgo(20),
    });
    mockGetTracker.mockResolvedValue([job]);

    await renderAndWait();

    await waitFor(
      () => expect(screen.getByRole("dialog")).toBeInTheDocument(),
      { timeout: 3000 }
    );
  });

  it("wizard shows the eligible job company in the dialog header", async () => {
    mockSearchParamsValue = new URLSearchParams("followup=true");
    const job = makeTrackerJob({
      job: makeJob({ title: "Feature Role", company: "FeatureCo" }),
      applicationOutcome: undefined,
      appliedAt: daysAgo(20),
    });
    mockGetTracker.mockResolvedValue([job]);

    await renderAndWait();

    const dialog = await waitFor(
      () => screen.getByRole("dialog"),
      { timeout: 3000 }
    );
    // The modal header contains "Did you hear back from FeatureCo?"
    expect(within(dialog).getByText(/FeatureCo/)).toBeInTheDocument();
  });

  it("also opens wizard for no-outcome app under 14 days when no stale ones exist", async () => {
    mockSearchParamsValue = new URLSearchParams("followup=true");
    const recentJob = makeTrackerJob({
      job: makeJob({ title: "Recent Applied" }),
      applicationOutcome: undefined,
      appliedAt: daysAgo(3),
    });
    mockGetTracker.mockResolvedValue([recentJob]);

    await renderAndWait();

    await waitFor(
      () => expect(screen.getByRole("dialog")).toBeInTheDocument(),
      { timeout: 3000 }
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Opening the link does NOT auto-record an outcome (SECURITY)
// ══════════════════════════════════════════════════════════════════════════════

describe("2 — opening ?followup=true does NOT call recordApplicationOutcome", () => {
  it("no API outcome call just from page load with ?followup=true", async () => {
    mockSearchParamsValue = new URLSearchParams("followup=true");
    const job = makeTrackerJob({
      applicationOutcome: undefined,
      appliedAt: daysAgo(20),
    });
    mockGetTracker.mockResolvedValue([job]);

    await renderAndWait();

    // Wait for wizard to open — confirms the param was processed
    await waitFor(
      () => expect(screen.getByRole("dialog")).toBeInTheDocument(),
      { timeout: 3000 }
    );

    // Outcome must NOT have been recorded by link click alone
    expect(mockRecordApplicationOutcome).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Selecting an outcome calls recordApplicationOutcome(matchId, outcome)
// ══════════════════════════════════════════════════════════════════════════════

describe("3 — selecting outcome in wizard calls recordApplicationOutcome", () => {
  it('clicking "Heard Back" calls recordApplicationOutcome with correct args', async () => {
    mockSearchParamsValue = new URLSearchParams("followup=true");
    const job = makeTrackerJob({
      job: makeJob({ title: "The Role", company: "TheCo" }),
      applicationOutcome: undefined,
      appliedAt: daysAgo(20),
    });
    mockGetTracker.mockResolvedValue([job]);

    await renderAndWait();

    await waitFor(
      () => expect(screen.getByRole("dialog")).toBeInTheDocument(),
      { timeout: 3000 }
    );

    const heardBackBtn = screen.getByRole("button", { name: "Heard Back" });
    fireEvent.click(heardBackBtn);

    await waitFor(
      () =>
        expect(mockRecordApplicationOutcome).toHaveBeenCalledWith(
          job._id,
          "heard_back"
        ),
      { timeout: 3000 }
    );
  });

  it("recordApplicationOutcome is called ONLY after explicit selection, not before", async () => {
    mockSearchParamsValue = new URLSearchParams("followup=true");
    const job = makeTrackerJob({
      applicationOutcome: undefined,
      appliedAt: daysAgo(20),
    });
    mockGetTracker.mockResolvedValue([job]);

    await renderAndWait();

    await waitFor(
      () => expect(screen.getByRole("dialog")).toBeInTheDocument(),
      { timeout: 3000 }
    );

    // Not yet called — wizard is open but user hasn't selected anything
    expect(mockRecordApplicationOutcome).not.toHaveBeenCalled();

    // Now select
    fireEvent.click(screen.getByRole("button", { name: "Got Interview" }));

    await waitFor(
      () =>
        expect(mockRecordApplicationOutcome).toHaveBeenCalledWith(
          job._id,
          "interview"
        ),
      { timeout: 3000 }
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Param is stripped after open
// ══════════════════════════════════════════════════════════════════════════════

describe("4 — ?followup param is stripped from URL after wizard opens", () => {
  it('router.replace("/tracker") is called to strip the followup param', async () => {
    mockSearchParamsValue = new URLSearchParams("followup=true");
    const job = makeTrackerJob({
      applicationOutcome: undefined,
      appliedAt: daysAgo(20),
    });
    mockGetTracker.mockResolvedValue([job]);

    await renderAndWait();

    await waitFor(
      () => expect(mockReplace).toHaveBeenCalledWith("/tracker"),
      { timeout: 3000 }
    );
  });

  it("router.replace is called even when no eligible apps (toast shown, no wizard)", async () => {
    mockSearchParamsValue = new URLSearchParams("followup=true");
    // All jobs already have outcomes
    const resolved = makeTrackerJob({ applicationOutcome: "heard_back" });
    mockGetTracker.mockResolvedValue([resolved]);

    await renderAndWait();

    await waitFor(
      () => expect(mockReplace).toHaveBeenCalledWith("/tracker"),
      { timeout: 3000 }
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. No eligible apps → wizard does NOT open
// ══════════════════════════════════════════════════════════════════════════════

describe("5 — no eligible apps → wizard does not open", () => {
  it("wizard dialog is NOT shown when tracker is empty", async () => {
    mockSearchParamsValue = new URLSearchParams("followup=true");
    mockGetTracker.mockResolvedValue([]);

    await renderAndWait();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("wizard dialog is NOT shown when all applied jobs have an outcome", async () => {
    mockSearchParamsValue = new URLSearchParams("followup=true");
    const resolved = makeTrackerJob({
      applicationOutcome: "heard_back",
      appliedAt: daysAgo(20),
    });
    mockGetTracker.mockResolvedValue([resolved]);

    await renderAndWait();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("wizard dialog is NOT shown when no ?followup param (normal page visit)", async () => {
    // mockSearchParamsValue is empty (set in beforeEach)
    const job = makeTrackerJob({
      applicationOutcome: undefined,
      appliedAt: daysAgo(20),
    });
    mockGetTracker.mockResolvedValue([job]);

    await renderAndWait();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. "Update status" button on eligible cards (salvage path for plain /tracker links)
// ══════════════════════════════════════════════════════════════════════════════

describe('6 — "Update status" button on eligible tracker cards', () => {
  it('renders "Update status" button on a card that satisfies shouldShowFollowUp', async () => {
    const job = makeTrackerJob({
      applicationOutcome: undefined,
      appliedAt: daysAgo(20),
    });
    mockGetTracker.mockResolvedValue([job]);

    await renderAndWait();

    expect(
      screen.getByRole("button", { name: "Update status" })
    ).toBeInTheDocument();
  });

  it('does NOT render "Update status" button on a card with an outcome', async () => {
    const job = makeTrackerJob({
      applicationOutcome: "heard_back",
      appliedAt: daysAgo(20),
    });
    mockGetTracker.mockResolvedValue([job]);

    await renderAndWait();

    expect(
      screen.queryByRole("button", { name: "Update status" })
    ).not.toBeInTheDocument();
  });

  it('clicking "Update status" opens the wizard without recording any outcome', async () => {
    const job = makeTrackerJob({
      job: makeJob({ title: "Card Role", company: "CardCo" }),
      applicationOutcome: undefined,
      appliedAt: daysAgo(20),
    });
    mockGetTracker.mockResolvedValue([job]);

    await renderAndWait();

    const updateBtn = screen.getByRole("button", { name: "Update status" });
    fireEvent.click(updateBtn);

    await waitFor(
      () => expect(screen.getByRole("dialog")).toBeInTheDocument(),
      { timeout: 3000 }
    );

    // No outcome recorded from clicking "Update status" alone
    expect(mockRecordApplicationOutcome).not.toHaveBeenCalled();
  });
});
