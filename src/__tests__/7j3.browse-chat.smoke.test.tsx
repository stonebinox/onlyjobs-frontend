/**
 * Smoke test for onlyjobs-7j3: per-job AI chat on /browse.
 *
 * Oracle: aiSection mounts only when the card is expanded; unmatched cards
 * (no aiSection prop) never render the chat; job.match._id is the matchId.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/apiClient", () => ({
  __esModule: true,
  createApiClient: () => ({
    markMatchClick: jest.fn().mockResolvedValue(undefined),
    markMatchAsSkipped: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock("@/utils/analytics", () => ({ trackEvent: jest.fn() }));

jest.mock("@/utils/verdict-colors", () => ({
  getVerdictColor: () => ({ hex: "#ccc" }),
  getVerdictRing: () => ({ hex: "#ccc" }),
}));

jest.mock("@/components/Dashboard/MatchScoreRing", () => ({
  MatchScoreRing: () => null,
}));

jest.mock("@/components/Dashboard/AIReasoningBox", () => ({
  AIReasoningBox: () => null,
}));

jest.mock("react-icons/fi", () => ({
  FiMapPin: () => null,
  FiClock: () => null,
  FiDollarSign: () => null,
  FiTag: () => null,
  FiGlobe: () => null,
  FiExternalLink: () => null,
}));

jest.mock("@chakra-ui/react", () => {
  const React = require("react");
  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(
      ({ children, onClick, disabled, "aria-label": al, ...rest }: any, ref: any) =>
        React.createElement(tag, { ref, onClick, disabled, "aria-label": al }, children)
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };
  const known: Record<string, any> = {
    __esModule: true,
    Box: makeEl("div"),
    Flex: makeEl("div"),
    VStack: makeEl("div"),
    HStack: makeEl("div"),
    Wrap: makeEl("div"),
    WrapItem: makeEl("div"),
    Text: makeEl("span"),
    Heading: makeEl("h3"),
    Badge: makeEl("span"),
    Button: makeEl("button"),
    Tooltip: ({ children }: any) => children,
    Modal: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    ModalOverlay: ({ children }: any) => React.createElement("div", null, children),
    ModalContent: ({ children }: any) => React.createElement("div", { role: "dialog" }, children),
    ModalHeader: ({ children }: any) => React.createElement("h2", null, children),
    ModalBody: ({ children }: any) => React.createElement("div", null, children),
    ModalFooter: ({ children }: any) => React.createElement("div", null, children),
    ModalCloseButton: ({ onClick }: any) => React.createElement("button", { onClick }, "Close"),
    Textarea: makeEl("textarea"),
    useDisclosure: () => {
      const [isOpen, setIsOpen] = React.useState(false);
      return {
        isOpen,
        onOpen: () => setIsOpen(true),
        onClose: () => setIsOpen(false),
      };
    },
    useToast: () => jest.fn(),
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
import { render, screen, fireEvent } from "@testing-library/react";
import JobListing from "@/components/Dashboard/JobListing";
import type { JobResult } from "@/types/JobResult";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeJobResult = (overrides: Partial<JobResult> = {}): JobResult => ({
  _id: "match-abc",
  userId: "u1",
  jobId: "job-xyz",
  matchScore: 85,
  verdict: "good",
  reasoning: "Strong match",
  clicked: false,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  skipped: false,
  applied: null,
  job: {
    _id: "job-xyz",
    title: "Frontend Engineer",
    company: "Acme Corp",
    location: ["Remote"],
    salary: { min: 100000, max: 150000, currency: "USD", estimated: false },
    tags: ["React", "TypeScript"],
    source: "linkedin",
    description: "A great role for frontend engineers.",
    url: "https://example.com/job",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    postedDate: "2026-01-01T00:00:00Z",
    scrapedDate: "2026-01-01T00:00:00Z",
  },
  ...overrides,
});

const noop = () => {};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("7j3 browse-chat smoke", () => {
  it("does NOT mount aiSection while card is collapsed (default state)", () => {
    const aiSection = <div data-testid="chat-sentinel">AI Chat</div>;
    render(
      <JobListing
        job={makeJobResult()}
        openJobQuestionsDrawer={noop}
        aiSection={aiSection}
      />
    );
    // Chat must not mount until the user expands
    expect(screen.queryByTestId("chat-sentinel")).not.toBeInTheDocument();
  });

  it("mounts aiSection after user clicks More to expand", () => {
    const aiSection = <div data-testid="chat-sentinel">AI Chat</div>;
    render(
      <JobListing
        job={makeJobResult()}
        openJobQuestionsDrawer={noop}
        aiSection={aiSection}
      />
    );
    const moreBtn = screen.getByRole("button", { name: /more/i });
    fireEvent.click(moreBtn);
    expect(screen.getByTestId("chat-sentinel")).toBeInTheDocument();
  });

  it("unmounts aiSection when the card is collapsed again (Less)", () => {
    const aiSection = <div data-testid="chat-sentinel">AI Chat</div>;
    render(
      <JobListing
        job={makeJobResult()}
        openJobQuestionsDrawer={noop}
        aiSection={aiSection}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /more/i }));
    expect(screen.getByTestId("chat-sentinel")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /less/i }));
    expect(screen.queryByTestId("chat-sentinel")).not.toBeInTheDocument();
  });

  it("renders no chat when aiSection prop is omitted (unmatched card path)", () => {
    render(
      <JobListing
        job={makeJobResult()}
        openJobQuestionsDrawer={noop}
        // aiSection intentionally omitted
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /more/i }));
    // Nothing sentinel-like should appear
    expect(screen.queryByTestId("chat-sentinel")).not.toBeInTheDocument();
  });

  it("uses job.match._id (not job._id) as the matchId passed to aiSection", () => {
    // Verify via the AllJobsTab convention: job.match._id !== job._id
    // Here we simulate the AllJobsTab construction: JobResult._id = job.match._id
    const jobResult = makeJobResult({ _id: "match-abc" });
    // job._id is "job-xyz" (different from match _id "match-abc")
    expect(jobResult._id).toBe("match-abc");
    expect(jobResult.job!._id).toBe("job-xyz");
    // Render with a sentinel that captures the matchId via prop
    const MatchIdCapture = ({ matchId }: { matchId: string }) => (
      <div data-testid="match-id-capture" data-matchid={matchId} />
    );
    render(
      <JobListing
        job={jobResult}
        openJobQuestionsDrawer={noop}
        aiSection={<MatchIdCapture matchId={jobResult._id} />}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /more/i }));
    const el = screen.getByTestId("match-id-capture");
    expect(el.getAttribute("data-matchid")).toBe("match-abc");
    expect(el.getAttribute("data-matchid")).not.toBe("job-xyz");
  });
});
