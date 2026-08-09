/**
 * ADVERSARIAL TESTS — onlyjobs-8of: JobChatSection lazy-mount wiring in BriefEntry.
 *
 * Assume the wiring is subtly wrong; tests are written to EXPOSE bugs.
 * Report PASS/FAIL. Failures are FINDINGS. Do NOT modify production code.
 *
 * FORBIDDEN (not opened): src/components/Today/BriefEntry.tsx, src/pages/today.tsx
 *
 * CONTRACT (oracle — all assertions trace here):
 *   1. NO_EAGER_MOUNT: rendering BriefEntry with aiSection makes ZERO
 *      createOrGetJobConversation calls before the Details drawer is opened.
 *   2. MOUNT_ON_OPEN: opening Details results in exactly ONE call with entry._id.
 *   3. SIBLING_ISOLATION: opening card B calls with B._id, never A._id.
 *   4. CLOSE_REOPEN: closing and reopening uses the same card's id, does not crash.
 *   5. EXISTING_FLOWS: open listing calls onOpenListing; skip modal opens;
 *      opening Details shows existing details content.
 *   6. FAILURE_ISOLATION: createOrGetJobConversation rejecting does not crash the
 *      page — drawer stays open and closable.
 *
 * DISCLOSURE: see bottom of file.
 */

// ── Mock control ──────────────────────────────────────────────────────────────

let mockCreateOrGetJobConversation: jest.Mock;
let mockMarkMatchClick: jest.Mock;
let mockMarkMatchAsSkipped: jest.Mock;

// ── apiClient mock ────────────────────────────────────────────────────────────

jest.mock("@/lib/apiClient", () => ({
  __esModule: true,
  createApiClient: () => ({
    createOrGetJobConversation: (...args: any[]) =>
      mockCreateOrGetJobConversation(...args),
    sendChatMessage: jest.fn().mockResolvedValue({ reply: "ok", conversationId: "cv-1" }),
    markMatchClick: (...args: any[]) => mockMarkMatchClick(...args),
    markMatchAsSkipped: (...args: any[]) => mockMarkMatchAsSkipped(...args),
  }),
}));

// ── Utility mocks (BriefEntry deps) ──────────────────────────────────────────

jest.mock("@/utils/analytics", () => ({ trackEvent: jest.fn() }));

jest.mock("@/utils/brief-utils", () => ({
  getOddsLine: () => "Good odds",
  getOddsColor: () => "green.500",
  isSafeUrl: () => true,
}));

jest.mock("@/utils/verdict-colors", () => ({
  getVerdictRing: () => ({ badgeBg: "green.100", badgeText: "green.800" }),
}));

jest.mock("@/utils/text-formatter", () => ({
  numberFormatter: (n: number) => String(n),
}));

// ── Icon stubs ────────────────────────────────────────────────────────────────

const nullIconProxy = new Proxy({}, { get: () => () => null });
jest.mock("react-icons/fi", () => nullIconProxy);
jest.mock("react-icons/bs", () => nullIconProxy);
jest.mock("react-icons/md", () => nullIconProxy);
jest.mock("react-icons/ai", () => nullIconProxy);
jest.mock("react-icons/io", () => nullIconProxy);
jest.mock("react-icons/io5", () => nullIconProxy);
jest.mock("react-icons/hi", () => nullIconProxy);
jest.mock("react-icons/ri", () => nullIconProxy);
jest.mock("react-icons/tb", () => nullIconProxy);
jest.mock("react-icons/lu", () => nullIconProxy);
jest.mock("react-icons/fa", () => nullIconProxy);

jest.mock("@emotion/react", () => ({
  keyframes: () => "mock-keyframes",
  css: (...args: any[]) => args,
}));

jest.mock("@/theme/theme", () => ({
  __esModule: true,
  default: {
    colors: {
      brand: { 50: "#EEF4FB", 500: "#1D4E89", 600: "#163B69", 700: "#112D50" },
      gray: { 50: "#F9FAFB", 100: "#F3F4F6", 200: "#E5E7EB", 500: "#6B7280" },
    },
  },
}));

// ── Chakra UI mock ────────────────────────────────────────────────────────────
// Comprehensive mock: real useDisclosure so Details toggle actually works;
// Drawer renders children only when isOpen (mirrors production gating behavior).

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
          ...rest
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

  // Real useDisclosure so the Details toggle actually works
  const useDisclosure = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    return {
      isOpen,
      onOpen: () => setIsOpen(true),
      onClose: () => setIsOpen(false),
      onToggle: () => setIsOpen((v: boolean) => !v),
    };
  };

  // Drawer renders children ONLY when isOpen — this is the lazy-mount gate
  const Drawer = ({ isOpen, children }: any) =>
    isOpen ? React.createElement("div", { "data-testid": "drawer" }, children) : null;
  const DrawerOverlay = () => null;
  const DrawerContent = ({ children }: any) => React.createElement("div", {}, children);
  const DrawerHeader = ({ children }: any) => React.createElement("div", {}, children);
  const DrawerBody = ({ children }: any) => React.createElement("div", {}, children);
  const DrawerCloseButton = ({ onClick }: any) =>
    React.createElement("button", { onClick, "data-testid": "drawer-close" }, "Close");

  const Modal = ({ isOpen, children }: any) =>
    isOpen ? React.createElement("div", { role: "dialog" }, children) : null;
  const ModalOverlay = () => null;
  const ModalContent = ({ children }: any) => React.createElement("div", {}, children);
  const ModalHeader = ({ children }: any) => React.createElement("div", {}, children);
  const ModalBody = ({ children }: any) => React.createElement("div", {}, children);
  const ModalFooter = ({ children }: any) => React.createElement("div", {}, children);
  const ModalCloseButton = ({ onClick }: any) =>
    React.createElement("button", { onClick }, "Close");

  const known: Record<string, any> = {
    __esModule: true,
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
    Button: ({ children, onClick, isDisabled, disabled, isLoading, ...rest }: any) =>
      React.createElement(
        "button",
        { onClick, disabled: isDisabled || disabled || isLoading || undefined },
        children
      ),
    IconButton: ({
      "aria-label": al,
      onClick,
      isDisabled,
      disabled,
      isLoading,
      children,
    }: any) =>
      React.createElement(
        "button",
        { "aria-label": al, onClick, disabled: isDisabled || disabled || isLoading || undefined },
        children ?? null
      ),
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
        { value, onChange, disabled, isDisabled, placeholder, type, onKeyPress, onKeyDown, ...rest }: any,
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
        { value, onChange, disabled, isDisabled, placeholder, onKeyPress, onKeyDown, ...rest }: any,
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
    Tooltip: ({ children }: any) => children,
    Skeleton: ({ children }: any) => React.createElement("div", null, children),
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerCloseButton,
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

// ── Imports ───────────────────────────────────────────────────────────────────

import React from "react";
import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";
import { BriefEntry } from "@/components/Today/BriefEntry";
import { JobChatSection } from "@/components/Dashboard/JobChatSection";
import type { JobResult } from "@/types/JobResult";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeEntry = (id: string, overrides: Partial<JobResult> = {}): JobResult => ({
  _id: id,
  userId: "user-1",
  jobId: `job-${id}`,
  matchScore: 85,
  verdict: "Strong match",
  reasoning: `Reasoning for ${id}.`,
  clicked: false,
  createdAt: "2026-08-09T00:00:00Z",
  updatedAt: "2026-08-09T00:00:00Z",
  skipped: false,
  applied: null,
  job: {
    _id: `job-${id}`,
    title: "Senior Engineer",
    company: "Acme Corp",
    location: ["Remote"],
    salary: { min: 100000, max: 150000, currency: "USD", estimated: false },
    tags: [],
    source: "linkedin",
    description: "A great role.",
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-09T00:00:00Z",
    postedDate: "2026-08-01",
    scrapedDate: "2026-08-09",
    url: `https://example.com/job/${id}`,
  },
  ...overrides,
});

const ENTRY_A = makeEntry("match-AAA");
const ENTRY_B = makeEntry("match-BBB");
const ENTRY_C = makeEntry("match-CCC");

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockCreateOrGetJobConversation = jest.fn().mockResolvedValue({
    conversationId: "conv-1",
    messages: [],
  });
  mockMarkMatchClick = jest.fn().mockResolvedValue({ success: true });
  mockMarkMatchAsSkipped = jest.fn().mockResolvedValue({ success: true });
  jest.spyOn(window, "open").mockImplementation(() => null);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Find the Details button that opens the drawer for a given rendered BriefEntry. */
function findDetailsButton(): HTMLButtonElement {
  const btn = Array.from(document.querySelectorAll("button")).find((b) =>
    /details/i.test(b.textContent ?? "")
  );
  if (!btn) throw new Error("Details button not found in DOM");
  return btn as HTMLButtonElement;
}

/** Find all Details buttons (one per rendered BriefEntry). */
function findAllDetailsButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll("button")).filter((b) =>
    /details/i.test(b.textContent ?? "")
  ) as HTMLButtonElement[];
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. NO EAGER MOUNT
//
// Rendering BriefEntry with a JobChatSection aiSection MUST make ZERO
// createOrGetJobConversation calls. A bug that mounts aiSection eagerly would
// POST once per visible card, creating conversations before the user ever
// opens a card.
// ══════════════════════════════════════════════════════════════════════════════

describe("1 — NO_EAGER_MOUNT: zero createOrGetJobConversation calls on render", () => {
  it("renders BriefEntry with aiSection — zero API calls before Details opens", async () => {
    render(
      <BriefEntry
        entry={ENTRY_A}
        onSkipped={jest.fn()}
        aiSection={<JobChatSection matchId={ENTRY_A._id} />}
      />
    );

    // Allow any microtasks / effects to flush
    await act(async () => {});

    // CONTRACT 1: zero calls — FINDING if this fails (eager mount)
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(0);
  });

  it("renders FIVE cards — still zero calls before any Details is opened", async () => {
    render(
      <div>
        {[ENTRY_A, ENTRY_B, ENTRY_C, makeEntry("d"), makeEntry("e")].map((entry) => (
          <BriefEntry
            key={entry._id}
            entry={entry}
            onSkipped={jest.fn()}
            aiSection={<JobChatSection matchId={entry._id} />}
          />
        ))}
      </div>
    );

    await act(async () => {});

    // FINDING: if called with any count > 0, eager mount is happening per visible card
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(0);
  });

  it("aiSection probe is not in DOM before Details opens (structural gate check)", async () => {
    render(
      <BriefEntry
        entry={ENTRY_A}
        onSkipped={jest.fn()}
        aiSection={<div data-testid="probe-aisection" />}
      />
    );

    await act(async () => {});

    // FINDING: if present, aiSection mounts eagerly outside the drawer
    expect(screen.queryByTestId("probe-aisection")).not.toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. MOUNT ON OPEN
//
// Opening the Details drawer must trigger exactly ONE createOrGetJobConversation
// call with the card's own entry._id as matchId.
// ══════════════════════════════════════════════════════════════════════════════

describe("2 — MOUNT_ON_OPEN: exactly one call with entry._id after Details opens", () => {
  it("clicking Details calls createOrGetJobConversation exactly once", async () => {
    render(
      <BriefEntry
        entry={ENTRY_A}
        onSkipped={jest.fn()}
        aiSection={<JobChatSection matchId={ENTRY_A._id} />}
      />
    );

    await act(async () => {});
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(0);

    // Open the drawer
    fireEvent.click(findDetailsButton());

    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    );

    // FINDING: if called with a different matchId — id bleed from another source
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledWith(ENTRY_A._id);
  });

  it("call arg is EXACTLY entry._id — not undefined, null, jobId, or a sibling id", async () => {
    render(
      <BriefEntry
        entry={ENTRY_A}
        onSkipped={jest.fn()}
        aiSection={<JobChatSection matchId={ENTRY_A._id} />}
      />
    );

    fireEvent.click(findDetailsButton());

    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalled(),
      { timeout: 3000 }
    );

    const arg = mockCreateOrGetJobConversation.mock.calls[0][0];

    // FINDING: arg is undefined — matchId was not threaded through
    expect(arg).toBeDefined();
    // FINDING: arg is entry.jobId instead of entry._id — confused MatchRecord vs Job id
    expect(arg).not.toBe(ENTRY_A.jobId);
    // FINDING: arg is something else entirely
    expect(arg).toBe(ENTRY_A._id);
  });

  it("aiSection renders in DOM after Details opens", async () => {
    render(
      <BriefEntry
        entry={ENTRY_A}
        onSkipped={jest.fn()}
        aiSection={<div data-testid="probe-aisection" />}
      />
    );

    expect(screen.queryByTestId("probe-aisection")).not.toBeInTheDocument();
    fireEvent.click(findDetailsButton());
    expect(screen.getByTestId("probe-aisection")).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. SIBLING ISOLATION
//
// With multiple cards, opening card B must call with B._id only.
// Opening card A then B must call with A._id then B._id — no id bleed.
// A bug where the first card's id is captured in a shared ref would fail these.
// ══════════════════════════════════════════════════════════════════════════════

describe("3 — SIBLING_ISOLATION: each card's id is used, no bleed", () => {
  it("opening card B (not A) calls with B._id, not A._id", async () => {
    render(
      <div>
        <BriefEntry
          entry={ENTRY_A}
          onSkipped={jest.fn()}
          aiSection={<JobChatSection matchId={ENTRY_A._id} />}
        />
        <BriefEntry
          entry={ENTRY_B}
          onSkipped={jest.fn()}
          aiSection={<JobChatSection matchId={ENTRY_B._id} />}
        />
      </div>
    );

    await act(async () => {});
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(0);

    // Open only card B (second Details button)
    const detailsBtns = findAllDetailsButtons();
    expect(detailsBtns.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(detailsBtns[1]);

    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    );

    const arg = mockCreateOrGetJobConversation.mock.calls[0][0];

    // FINDING: called with A._id instead of B._id — shared ref / closure captures first id
    expect(arg).toBe(ENTRY_B._id);
    expect(arg).not.toBe(ENTRY_A._id);
  });

  it("opening A then B produces two calls: A._id first, then B._id", async () => {
    render(
      <div>
        <BriefEntry
          entry={ENTRY_A}
          onSkipped={jest.fn()}
          aiSection={<JobChatSection matchId={ENTRY_A._id} />}
        />
        <BriefEntry
          entry={ENTRY_B}
          onSkipped={jest.fn()}
          aiSection={<JobChatSection matchId={ENTRY_B._id} />}
        />
      </div>
    );

    await act(async () => {});

    const detailsBtns = findAllDetailsButtons();
    expect(detailsBtns.length).toBeGreaterThanOrEqual(2);

    // Open card A
    fireEvent.click(detailsBtns[0]);
    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    );
    expect(mockCreateOrGetJobConversation.mock.calls[0][0]).toBe(ENTRY_A._id);

    // Open card B
    fireEvent.click(detailsBtns[1]);
    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(2),
      { timeout: 3000 }
    );

    // FINDING: second call used A._id again — sibling isolation broken
    expect(mockCreateOrGetJobConversation.mock.calls[1][0]).toBe(ENTRY_B._id);
  });

  it("three cards: each opened independently uses its own id", async () => {
    const entries = [ENTRY_A, ENTRY_B, ENTRY_C];

    render(
      <div>
        {entries.map((entry) => (
          <BriefEntry
            key={entry._id}
            entry={entry}
            onSkipped={jest.fn()}
            aiSection={<JobChatSection matchId={entry._id} />}
          />
        ))}
      </div>
    );

    await act(async () => {});
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(0);

    const detailsBtns = findAllDetailsButtons();
    expect(detailsBtns.length).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < 3; i++) {
      const entry = entries[i];
      fireEvent.click(detailsBtns[i]);

      await waitFor(
        () => expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(i + 1),
        { timeout: 3000 }
      );

      const arg = mockCreateOrGetJobConversation.mock.calls[i][0];
      // FINDING: any call used a wrong id
      expect(arg).toBe(entry._id);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CLOSE / REOPEN
//
// Closing the Details drawer and reopening it:
//   - must not crash
//   - if it remounts JobChatSection, must use the same card's id (not a sibling's)
// ══════════════════════════════════════════════════════════════════════════════

describe("4 — CLOSE_REOPEN: close/open cycle is stable", () => {
  it("close and reopen does not crash the page", async () => {
    const onSkipped = jest.fn();

    const { container } = render(
      <BriefEntry
        entry={ENTRY_A}
        onSkipped={onSkipped}
        aiSection={<JobChatSection matchId={ENTRY_A._id} />}
      />
    );

    // Open
    fireEvent.click(findDetailsButton());
    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    );

    // Close — find close button inside the drawer
    const closeBtn = container.querySelector("[data-testid='drawer-close'], button")!;
    // The DrawerCloseButton renders as "Close" — find it
    const allBtns = Array.from(container.querySelectorAll("button"));
    const closeBtnEl = allBtns.find((b) => /^close$/i.test(b.textContent ?? ""));

    if (closeBtnEl) {
      fireEvent.click(closeBtnEl);
      await act(async () => {});
    }

    // Reopen — Details button must still be present
    const detailsBtn = findDetailsButton();
    expect(detailsBtn).toBeTruthy();

    // Should not throw
    expect(() => fireEvent.click(detailsBtn)).not.toThrow();

    await act(async () => {});
    // No crash = pass. Additional call count depends on whether component remounts.
    // Either 1 (stable mount) or 2 (remount on reopen) is valid;
    // what is NOT valid is using a sibling's id.
    const calls = mockCreateOrGetJobConversation.mock.calls;
    if (calls.length > 1) {
      // FINDING: if the remount used a different id
      expect(calls[calls.length - 1][0]).toBe(ENTRY_A._id);
    }
  });

  it("reopen after close uses ENTRY_A._id — not a sibling's id — in a multi-card render", async () => {
    render(
      <div>
        <BriefEntry
          entry={ENTRY_A}
          onSkipped={jest.fn()}
          aiSection={<JobChatSection matchId={ENTRY_A._id} />}
        />
        <BriefEntry
          entry={ENTRY_B}
          onSkipped={jest.fn()}
          aiSection={<JobChatSection matchId={ENTRY_B._id} />}
        />
      </div>
    );

    await act(async () => {});

    const [btnA] = findAllDetailsButtons();

    // Open card A
    fireEvent.click(btnA);
    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    );
    expect(mockCreateOrGetJobConversation.mock.calls[0][0]).toBe(ENTRY_A._id);

    // Close card A's drawer
    const allBtns = Array.from(document.querySelectorAll("button"));
    const closeBtnEl = allBtns.find((b) => /^close$/i.test(b.textContent ?? ""));
    if (closeBtnEl) {
      fireEvent.click(closeBtnEl);
      await act(async () => {});
    }

    // Reopen card A
    const [reopenBtnA] = findAllDetailsButtons();
    fireEvent.click(reopenBtnA);
    await act(async () => {});

    // Any call after the first must also use A._id
    const allArgs = mockCreateOrGetJobConversation.mock.calls.map((c) => c[0]);
    for (const arg of allArgs) {
      // FINDING: reopen used B._id — id leaked from sibling on close/reopen
      expect(arg).toBe(ENTRY_A._id);
      expect(arg).not.toBe(ENTRY_B._id);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. EXISTING FLOWS UNCHANGED
//
// Adding aiSection must not break existing BriefEntry behaviors:
//   - "Open listing" still calls onOpenListing with the entry
//   - "Not for me" / skip button still opens the skip modal
//   - Opening Details still shows existing details content (reasoning, description)
// ══════════════════════════════════════════════════════════════════════════════

describe("5 — EXISTING_FLOWS: prior BriefEntry functionality unaffected by aiSection", () => {
  it("Open listing still calls onOpenListing with the entry", async () => {
    const onOpenListing = jest.fn();

    render(
      <BriefEntry
        entry={ENTRY_A}
        onSkipped={jest.fn()}
        onOpenListing={onOpenListing}
        aiSection={<JobChatSection matchId={ENTRY_A._id} />}
      />
    );

    // Find "Open listing" button — exact label may vary
    const openBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      /open.?listing|view.?listing|open|apply/i.test(b.textContent ?? b.getAttribute("aria-label") ?? "")
    );

    if (openBtn) {
      fireEvent.click(openBtn);
      // FINDING: onOpenListing not called — aiSection wiring broke the existing click handler
      expect(onOpenListing).toHaveBeenCalledTimes(1);
      expect(onOpenListing).toHaveBeenCalledWith(ENTRY_A);
    } else {
      // Might be an <a> element — safe url guard may prevent window.open
      // but at minimum the AI section must not have displaced or hidden the button
      // This is informational — log as FINDING if UI is completely missing
      const externalLink = document.querySelector(`a[href="${ENTRY_A.job!.url}"]`);
      // Either the button or the anchor must exist
      expect(openBtn || externalLink).toBeTruthy();
    }
  });

  it("Not for me button still opens the skip modal (aiSection did not displace it)", async () => {
    render(
      <BriefEntry
        entry={ENTRY_A}
        onSkipped={jest.fn()}
        aiSection={<JobChatSection matchId={ENTRY_A._id} />}
      />
    );

    const skipBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      /not for me|skip|dismiss/i.test(b.textContent ?? b.getAttribute("aria-label") ?? "")
    );

    // FINDING: skip button missing — aiSection displaced or removed it
    expect(skipBtn).toBeDefined();
    fireEvent.click(skipBtn!);

    // The skip modal or reason-selection UI should appear
    await waitFor(
      () => {
        const hasModal = !!document.querySelector("[role='dialog']");
        const hasReasonBtns = Array.from(document.querySelectorAll("button")).some((b) =>
          /salary|location|skill|fit|interest|other/i.test(b.textContent ?? "")
        );
        // FINDING: neither dialog nor reason buttons appeared after clicking skip
        expect(hasModal || hasReasonBtns).toBe(true);
      },
      { timeout: 2000 }
    );
  });

  it("opening Details still shows existing details content (reasoning visible)", async () => {
    render(
      <BriefEntry
        entry={ENTRY_A}
        onSkipped={jest.fn()}
        aiSection={<JobChatSection matchId={ENTRY_A._id} />}
      />
    );

    fireEvent.click(findDetailsButton());
    await act(async () => {});

    // The entry reasoning should be visible in the Details drawer
    // FINDING: reasoning absent — aiSection replaced existing details content
    await waitFor(
      () => {
        const body = document.body.textContent ?? "";
        // Either reasoning text or job description must be present
        expect(
          body.includes(`Reasoning for ${ENTRY_A._id}`) ||
          body.includes("A great role") ||
          body.includes("Senior Engineer")
        ).toBe(true);
      },
      { timeout: 2000 }
    );
  });

  it("no createOrGetJobConversation call when skip is used (not when Details opens)", async () => {
    render(
      <BriefEntry
        entry={ENTRY_A}
        onSkipped={jest.fn()}
        aiSection={<JobChatSection matchId={ENTRY_A._id} />}
      />
    );

    await act(async () => {});

    const skipBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      /not for me|skip|dismiss/i.test(b.textContent ?? b.getAttribute("aria-label") ?? "")
    );

    if (skipBtn) {
      fireEvent.click(skipBtn);
      await act(async () => {});

      // FINDING: clicking Skip triggered a createOrGetJobConversation call — wrong
      expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(0);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. FAILURE ISOLATION
//
// If createOrGetJobConversation rejects, the Details drawer must stay open and
// closable. The page must not crash (JobChatSection renders its own error state).
// ══════════════════════════════════════════════════════════════════════════════

describe("6 — FAILURE_ISOLATION: API failure does not crash page or close drawer", () => {
  it("drawer stays open when createOrGetJobConversation rejects", async () => {
    mockCreateOrGetJobConversation.mockRejectedValue(new Error("Network failure"));

    render(
      <BriefEntry
        entry={ENTRY_A}
        onSkipped={jest.fn()}
        aiSection={<JobChatSection matchId={ENTRY_A._id} />}
      />
    );

    fireEvent.click(findDetailsButton());

    // Wait for the error to settle
    await act(async () => {});
    await act(async () => {});

    // FINDING: drawer not in DOM — error caused drawer to close
    const drawer = document.querySelector("[data-testid='drawer']");
    expect(drawer).not.toBeNull();
  });

  it("close button inside the drawer does not throw after a rejected createOrGetJobConversation", async () => {
    // NOTE: The mock DrawerCloseButton renders with an onClick prop, but Chakra's
    // real DrawerCloseButton gets onClose from DrawerContext (not an explicit onClick).
    // In this mock environment the close button may not actually close the drawer —
    // that is a MOCK LIMITATION, not a production finding.
    // What this test CAN verify: clicking the close button does NOT throw (no crash).
    mockCreateOrGetJobConversation.mockRejectedValue(new Error("Service down"));

    render(
      <BriefEntry
        entry={ENTRY_A}
        onSkipped={jest.fn()}
        aiSection={<JobChatSection matchId={ENTRY_A._id} />}
      />
    );

    fireEvent.click(findDetailsButton());

    await act(async () => {});
    await act(async () => {});

    // Close button must be present (not hidden due to error state)
    const closeBtnEl = Array.from(document.querySelectorAll("button")).find((b) =>
      /^close$/i.test(b.textContent ?? "")
    );

    // FINDING: close button disappeared from the drawer after an API error
    expect(closeBtnEl).toBeDefined();

    // FINDING: clicking the close button throws (uncaught error in click handler)
    expect(() => fireEvent.click(closeBtnEl!)).not.toThrow();
  });

  it("error in aiSection does NOT prevent existing Details content from appearing", async () => {
    mockCreateOrGetJobConversation.mockRejectedValue(new Error("Chat unavailable"));

    render(
      <BriefEntry
        entry={ENTRY_A}
        onSkipped={jest.fn()}
        aiSection={<JobChatSection matchId={ENTRY_A._id} />}
      />
    );

    fireEvent.click(findDetailsButton());
    await act(async () => {});
    await act(async () => {});

    // Job details / reasoning must still be visible even if chat errored
    // FINDING: entire drawer blanked due to uncaught error boundary missing
    const body = document.body.textContent ?? "";
    expect(
      body.includes(`Reasoning for ${ENTRY_A._id}`) ||
      body.includes("Senior Engineer") ||
      body.includes("A great role")
    ).toBe(true);
  });

  it("resolved {error} from createOrGetJobConversation does not crash page", async () => {
    mockCreateOrGetJobConversation.mockResolvedValue({ error: "Conversation unavailable" });

    render(
      <BriefEntry
        entry={ENTRY_A}
        onSkipped={jest.fn()}
        aiSection={<JobChatSection matchId={ENTRY_A._id} />}
      />
    );

    // Should not throw on render + open
    expect(() => fireEvent.click(findDetailsButton())).not.toThrow();

    await act(async () => {});
    await act(async () => {});

    // Page still standing — drawer still in DOM
    const drawer = document.querySelector("[data-testid='drawer']");
    // FINDING: resolved {error} caused crash that closed the drawer
    expect(drawer).not.toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. CALL COUNT DISCIPLINE
//
// Opening Details once must call createOrGetJobConversation exactly once.
// Multiple re-renders of the parent must not trigger extra calls.
// ══════════════════════════════════════════════════════════════════════════════

describe("7 — CALL_COUNT: exactly one call per open, not more", () => {
  it("exactly ONE createOrGetJobConversation call after one Details open", async () => {
    render(
      <BriefEntry
        entry={ENTRY_A}
        onSkipped={jest.fn()}
        aiSection={<JobChatSection matchId={ENTRY_A._id} />}
      />
    );

    fireEvent.click(findDetailsButton());

    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalled(),
      { timeout: 3000 }
    );

    // Brief wait to confirm no additional calls fire
    await new Promise((r) => setTimeout(r, 200));

    // FINDING: more than 1 call — double-mount or effect re-run bug
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(1);
  });

  it("call count does not grow as parent receives new props after drawer open", async () => {
    const onSkipped = jest.fn();
    const { rerender } = render(
      <BriefEntry
        entry={ENTRY_A}
        onSkipped={onSkipped}
        aiSection={<JobChatSection matchId={ENTRY_A._id} />}
      />
    );

    fireEvent.click(findDetailsButton());

    await waitFor(
      () => expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    );

    // Rerender parent with same entry (simulates state update in the today page)
    rerender(
      <BriefEntry
        entry={ENTRY_A}
        onSkipped={onSkipped}
        aiSection={<JobChatSection matchId={ENTRY_A._id} />}
      />
    );

    await act(async () => {});

    // FINDING: rerender triggered additional createOrGetJobConversation calls
    expect(mockCreateOrGetJobConversation).toHaveBeenCalledTimes(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DISCLOSURE
//
// FILES READ (permitted by adversarial-author rules):
//   src/__tests__/8of.BriefEntry-aiSection.smoke.test.tsx
//     — BriefEntry import path, prop names (entry, onSkipped, onOpenListing, aiSection)
//     — JobResult fixture shape (ENTRY constant)
//     — Chakra UI mock pattern: real useDisclosure, Drawer gating on isOpen
//     — utility mocks: brief-utils, verdict-colors, text-formatter, analytics
//     — "Details" button text confirmed as the drawer trigger
//   src/__tests__/tqx.session-expiry.adversarial.test.tsx
//     — JobChatSection import path (@/components/Dashboard/JobChatSection)
//     — Comprehensive Chakra mock (Input, Textarea, Alert with role=alert, IconButton)
//     — nullIconProxy pattern for react-icon stubs
//     — apiClient mock shape with all JobChatSection methods stubbed
//   src/__tests__/78n.jobchat.smoke.test.tsx
//     — JobChatSection prop: { matchId: string }
//     — Spinner renders as role="status"
//   src/__tests__/today.component.test.tsx
//     — Page-level harness; confirmed today page mock strategy
//     — makeEntry/makeJob fixture helpers (adapted, not copied)
//   src/lib/apiClient.ts
//     — createOrGetJobConversation signature: (matchId: string) => Promise<...>
//     — sendChatMessage signature
//   src/types/JobResult.ts
//     — JobResult._id is the MatchRecord id (used as matchId)
//
// FILES NOT OPENED (forbidden):
//   src/components/Today/BriefEntry.tsx    ✓ NOT opened
//   src/pages/today.tsx                    ✓ NOT opened
//
// INCIDENTAL DISCLOSURES:
//   From 8of.BriefEntry-aiSection.smoke.test.tsx (permitted read):
//   - Button text "Details" confirmed: used to find the drawer trigger. HOW AVOIDED:
//     tests rely on the button text as observable UI, which is correct per contract.
//   - DrawerCloseButton renders "Close": used only for close/reopen test.
//     HOW AVOIDED: test falls back gracefully if not present.
//
// UNTESTABLE-WITHOUT-READING (findings):
//   1. Whether close actually unmounts JobChatSection (vs hiding it): cannot verify
//      internal mount/unmount lifecycle without reading BriefEntry. Test 4 handles
//      both "remount on reopen" and "stable mount" as valid outcomes.
//   2. Whether the Drawer's isOpen gate is implemented via Chakra Drawer, a
//      conditional render, or CSS visibility: the mock's Drawer only renders when
//      isOpen, which may not match the real component if it uses a different
//      gating mechanism. If production uses CSS display:none instead, the
//      zero-call assertion (test 1) could be a false pass.
//   3. The exact label of the close button inside the drawer: close/reopen tests
//      attempt to find "Close" text but fall back gracefully — if the close button
//      uses an icon with no visible text, criterion 4's close step silently skips.
//   4. DrawerCloseButton wiring: Chakra's real DrawerCloseButton gets onClose from
//      DrawerContext, not from an explicit onClick prop. The mock here passes it as
//      onClick. If BriefEntry uses DrawerCloseButton without an explicit onClick
//      (relying on context), the button click does NOT actually close the drawer in
//      the mock environment. Test 6 was therefore narrowed to assert only that
//      clicking does not throw — not that the drawer disappears. If the production
//      drawer cannot be closed after an error, that would require a real browser
//      test or a more faithful Chakra context mock to detect.
// ══════════════════════════════════════════════════════════════════════════════
