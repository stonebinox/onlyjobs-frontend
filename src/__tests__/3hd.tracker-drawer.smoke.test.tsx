/**
 * Smoke tests for onlyjobs-3hd: tracker cards clickable -> job detail drawer.
 *
 * Oracle: onlyjobs-3hd spec — clicking a card opens the detail drawer;
 * Move-to menu records an outcome and does NOT open the drawer;
 * a card with job.job===null still opens the drawer.
 *
 * DISCLOSURE — files read while writing mocks:
 *   - tracker.tsx: TrackerCard click wiring, onOpenDetails prop, state management.
 *   - TrackerDetailDrawer.tsx: isOpen/job/onClose prop interface.
 *   - FollowUpWizardModal.tsx: OUTCOME_OPTIONS keys (public contract).
 *   - oaq.smoke.test.tsx: Chakra mock pattern copied verbatim (established pattern).
 * No assertions encode implementation internals.
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

// TrackerDetailDrawer — mock to expose isOpen/job without rendering internals
jest.mock("@/components/Dashboard/TrackerDetailDrawer", () => ({
  __esModule: true,
  TrackerDetailDrawer: ({ isOpen, job, onClose }: any) =>
    isOpen
      ? React.createElement(
          "div",
          { "data-testid": "tracker-detail-drawer" },
          React.createElement(
            "span",
            { "data-testid": "drawer-title" },
            job?.job?.title ?? "Listing no longer available"
          ),
          React.createElement("button", { onClick: onClose, "data-testid": "drawer-close" }, "Close")
        )
      : null,
}));

// Chakra UI — same comprehensive mock as oaq.smoke.test.tsx
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
  act,
} from "@testing-library/react";
import TrackerPage from "@/pages/tracker";
import type { JobResult } from "@/types/JobResult";
import type { Job } from "@/types/Job";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

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
  description: "A description",
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
  verdict: "Strong match",
  reasoning: "Good fit",
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
// 1. Clicking a card opens the detail drawer for that match
// ══════════════════════════════════════════════════════════════════════════════

describe("1 — clicking a card opens the detail drawer", () => {
  it("shows the drawer with the job title after clicking the card", async () => {
    const job = makeTrackerJob({ job: makeJob({ title: "SWE Role", company: "TechCo", url: "" }) });
    mockGetTracker.mockResolvedValue([job]);

    await renderAndWait();

    // The title Text is a span (no url => no link); clicking it bubbles to card Box
    const titleEl = screen.getByText("SWE Role");
    const cardEl = titleEl.closest('[role="button"]');
    expect(cardEl).not.toBeNull();
    fireEvent.click(cardEl!);

    expect(screen.getByTestId("tracker-detail-drawer")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-title")).toHaveTextContent("SWE Role");
  });

  it("closes the drawer when onClose is called", async () => {
    const job = makeTrackerJob({ job: makeJob({ title: "SWE Role", company: "TechCo", url: "" }) });
    mockGetTracker.mockResolvedValue([job]);

    await renderAndWait();

    fireEvent.click(screen.getByText("SWE Role").closest('[role="button"]')!);
    expect(screen.getByTestId("tracker-detail-drawer")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("drawer-close"));
    expect(screen.queryByTestId("tracker-detail-drawer")).not.toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Move-to menu records outcome and does NOT open the drawer
// ══════════════════════════════════════════════════════════════════════════════

describe("2 — Move-to menu records outcome without opening the drawer", () => {
  it("clicking a MenuItem calls recordApplicationOutcome and does not open the drawer", async () => {
    const job = makeTrackerJob({ job: makeJob({ title: "SWE Role" }) });
    mockGetTracker.mockResolvedValue([job]);

    await renderAndWait();

    // Drawer is not open before anything is clicked
    expect(screen.queryByTestId("tracker-detail-drawer")).not.toBeInTheDocument();

    // Click the "Heard back" MenuItem — stopPropagation should prevent card open
    const heardBackItem = screen.getByRole("menuitem", { name: "Heard back" });
    fireEvent.click(heardBackItem);

    await waitFor(() =>
      expect(mockRecordApplicationOutcome).toHaveBeenCalledWith(job._id, "heard_back"),
      { timeout: 3000 }
    );

    // Drawer must NOT have opened from the menu click
    expect(screen.queryByTestId("tracker-detail-drawer")).not.toBeInTheDocument();
  });

  it("clicking the Move-to MenuButton does not open the drawer", async () => {
    const job = makeTrackerJob({ job: makeJob({ title: "SWE Role" }) });
    mockGetTracker.mockResolvedValue([job]);

    await renderAndWait();

    const moveToBtn = screen.getByRole("button", { name: "Move to" });
    fireEvent.click(moveToBtn);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(screen.queryByTestId("tracker-detail-drawer")).not.toBeInTheDocument();
    expect(mockRecordApplicationOutcome).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Card with job.job === null still opens the drawer
// ══════════════════════════════════════════════════════════════════════════════

describe("3 — card with missing job listing still opens the drawer", () => {
  it("clicking a card where job.job is null opens the drawer with fallback title", async () => {
    const job = makeTrackerJob({ job: null });
    mockGetTracker.mockResolvedValue([job]);

    await renderAndWait();

    // No job data -> title renders as "Listing no longer available"
    const titleEl = screen.getByText("Listing no longer available");
    const cardEl = titleEl.closest('[role="button"]');
    expect(cardEl).not.toBeNull();
    fireEvent.click(cardEl!);

    expect(screen.getByTestId("tracker-detail-drawer")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-title")).toHaveTextContent("Listing no longer available");
  });
});
