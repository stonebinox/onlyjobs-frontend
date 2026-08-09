/**
 * Smoke test for onlyjobs-8of: aiSection wiring in BriefEntry.
 *
 * Oracle: onlyjobs-8of spec — aiSection must NOT mount before Details opens
 * (eager mount would POST createOrGetJobConversation for every visible card);
 * aiSection MUST appear once Details is opened.
 */

// ─── Mock control ────────────────────────────────────────────────────────────

let mockMarkMatchClick: jest.Mock;
let mockMarkMatchAsSkipped: jest.Mock;

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("@/lib/apiClient", () => ({
  __esModule: true,
  createApiClient: () => ({
    markMatchClick: (...args: any[]) => mockMarkMatchClick(...args),
    markMatchAsSkipped: (...args: any[]) => mockMarkMatchAsSkipped(...args),
  }),
}));

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

jest.mock("@chakra-ui/react", () => {
  const React = require("react");

  // Real useDisclosure so the Details toggle actually works in tests
  const useDisclosure = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    return {
      isOpen,
      onOpen: () => setIsOpen(true),
      onClose: () => setIsOpen(false),
    };
  };

  const useToast = () => () => {};

  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(({ children, ...rest }: any, ref: any) =>
      React.createElement(tag, { ref }, children)
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };

  // Drawer renders children only when isOpen is true (mirrors real behaviour for gate test)
  const Drawer = ({ isOpen, children }: any) =>
    isOpen ? React.createElement("div", { "data-testid": "drawer" }, children) : null;
  const DrawerOverlay = () => null;
  const DrawerContent = ({ children }: any) => React.createElement("div", {}, children);
  const DrawerHeader = ({ children }: any) => React.createElement("div", {}, children);
  const DrawerBody = ({ children }: any) => React.createElement("div", {}, children);
  const DrawerCloseButton = () => null;

  const Modal = ({ isOpen, children }: any) =>
    isOpen ? React.createElement("div", {}, children) : null;
  const ModalOverlay = () => null;
  const ModalContent = ({ children }: any) => React.createElement("div", {}, children);
  const ModalHeader = ({ children }: any) => React.createElement("div", {}, children);
  const ModalBody = ({ children }: any) => React.createElement("div", {}, children);
  const ModalFooter = ({ children }: any) => React.createElement("div", {}, children);
  const ModalCloseButton = () => null;

  const known: Record<string, any> = {
    __esModule: true,
    Box: makeEl("div"),
    VStack: makeEl("div"),
    HStack: makeEl("div"),
    Text: makeEl("span"),
    Badge: makeEl("span"),
    Button: ({ children, onClick }: any) =>
      React.createElement("button", { onClick }, children),
    Textarea: makeEl("textarea"),
    Wrap: makeEl("div"),
    WrapItem: makeEl("div"),
    Alert: makeEl("div"),
    AlertIcon: () => null,
    AlertDescription: makeEl("span"),
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
    useToast,
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

// ─── Imports ─────────────────────────────────────────────────────────────────

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BriefEntry } from "@/components/Today/BriefEntry";
import { JobResult } from "@/types/JobResult";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ENTRY: JobResult = {
  _id: "match-abc",
  userId: "user-1",
  jobId: "job-1",
  matchScore: 85,
  verdict: "Strong match",
  reasoning: "Great fit for your skills.",
  clicked: false,
  createdAt: "2026-08-09T00:00:00Z",
  updatedAt: "2026-08-09T00:00:00Z",
  skipped: false,
  applied: null,
  job: {
    _id: "job-1",
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
    url: "https://example.com/job/1",
  },
};

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockMarkMatchClick = jest.fn().mockResolvedValue({});
  mockMarkMatchAsSkipped = jest.fn().mockResolvedValue({});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("BriefEntry aiSection gating (onlyjobs-8of)", () => {
  it("does NOT render aiSection before Details is opened", () => {
    render(
      <BriefEntry
        entry={ENTRY}
        onSkipped={jest.fn()}
        aiSection={<div data-testid="ai-section-probe" />}
      />
    );
    expect(screen.queryByTestId("ai-section-probe")).not.toBeInTheDocument();
  });

  it("renders aiSection after Details button is clicked", () => {
    render(
      <BriefEntry
        entry={ENTRY}
        onSkipped={jest.fn()}
        aiSection={<div data-testid="ai-section-probe" />}
      />
    );
    // aiSection must not be mounted yet
    expect(screen.queryByTestId("ai-section-probe")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Details"));

    expect(screen.getByTestId("ai-section-probe")).toBeInTheDocument();
  });

  it("renders without aiSection prop (backwards compat)", () => {
    render(<BriefEntry entry={ENTRY} onSkipped={jest.fn()} />);
    expect(screen.getByText("Great fit for your skills.")).toBeInTheDocument();
  });
});
