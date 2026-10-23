/**
 * Smoke test: choosing the "Other" skip reason requires non-blank details
 * (BriefEntry, VisitedList and JobListing skip modals).
 */

let mockMarkMatchAsSkipped: jest.Mock;

jest.mock("@/lib/apiClient", () => ({
  __esModule: true,
  createApiClient: () => ({
    markMatchClick: jest.fn(),
    markMatchApplied: jest.fn(),
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
  getVerdictColor: () => ({ hex: "#38A169" }),
}));

jest.mock("@/components/Dashboard/MatchScoreRing", () => ({ MatchScoreRing: () => null }));
jest.mock("@/components/Dashboard/AIReasoningBox", () => ({ AIReasoningBox: () => null }));

jest.mock("@/utils/text-formatter", () => ({
  numberFormatter: (n: number) => String(n),
}));

jest.mock("@chakra-ui/react", () => {
  const React = require("react");

  const useDisclosure = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    return {
      isOpen,
      onOpen: () => setIsOpen(true),
      onClose: () => setIsOpen(false),
    };
  };

  const cache: Record<string, any> = {};
  const makeEl = (tag: string) => {
    if (cache[tag]) return cache[tag];
    const C = React.forwardRef(({ children }: any, ref: any) =>
      React.createElement(tag, { ref }, children)
    );
    C.displayName = tag;
    cache[tag] = C;
    return C;
  };

  const Modal = ({ isOpen, children }: any) =>
    isOpen ? React.createElement("div", {}, children) : null;
  const passthrough = ({ children }: any) => React.createElement("div", {}, children);

  const known: Record<string, any> = {
    __esModule: true,
    Box: makeEl("div"),
    VStack: makeEl("div"),
    HStack: makeEl("div"),
    Center: makeEl("div"),
    Text: makeEl("span"),
    Badge: makeEl("span"),
    Spinner: () => null,
    Button: ({ children, onClick, isDisabled }: any) =>
      React.createElement("button", { onClick, disabled: !!isDisabled }, children),
    Textarea: ({ value, onChange, placeholder }: any) =>
      React.createElement("textarea", { value, onChange, placeholder }),
    Wrap: makeEl("div"),
    WrapItem: makeEl("div"),
    Alert: makeEl("div"),
    AlertIcon: () => null,
    AlertDescription: makeEl("span"),
    Modal,
    ModalOverlay: () => null,
    ModalContent: passthrough,
    ModalHeader: passthrough,
    ModalBody: passthrough,
    ModalFooter: passthrough,
    ModalCloseButton: () => null,
    useDisclosure,
    useToast: () => () => {},
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

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BriefEntry } from "@/components/Today/BriefEntry";
import { VisitedList } from "@/components/Today/VisitedList";
import JobListing from "@/components/Dashboard/JobListing";
import { JobResult } from "@/types/JobResult";

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
} as JobResult;

beforeEach(() => {
  mockMarkMatchAsSkipped = jest.fn().mockResolvedValue({});
});

const cases: Array<[string, () => void]> = [
  [
    "BriefEntry",
    () => render(<BriefEntry entry={ENTRY} onSkipped={jest.fn()} />),
  ],
  [
    "VisitedList",
    () =>
      render(
        <VisitedList
          rows={[ENTRY]}
          loading={false}
          error={null}
          onOpenDrawer={jest.fn()}
          onApplied={jest.fn()}
          onSkipped={jest.fn()}
        />
      ),
  ],
];

describe.each(cases)("%s: 'Other' requires details", (_name, renderIt) => {
  it("disables skip for blank details and enables + sends typed details", async () => {
    renderIt();
    fireEvent.click(screen.getByText("Not for me"));
    fireEvent.click(screen.getByText("Other"));

    const skipBtn = screen.getByText("Skip this job") as HTMLButtonElement;
    expect(skipBtn.disabled).toBe(true);

    const textarea = screen.getByPlaceholderText("Please tell us more...");
    fireEvent.change(textarea, { target: { value: "   " } });
    expect(skipBtn.disabled).toBe(true);
    fireEvent.click(skipBtn);
    expect(mockMarkMatchAsSkipped).not.toHaveBeenCalled();

    fireEvent.change(textarea, { target: { value: "Needs relocation" } });
    expect(skipBtn.disabled).toBe(false);
    fireEvent.click(skipBtn);

    await waitFor(() => expect(mockMarkMatchAsSkipped).toHaveBeenCalledTimes(1));
    expect(mockMarkMatchAsSkipped).toHaveBeenCalledWith(
      "match-abc",
      "other",
      "Needs relocation"
    );
  });

  it("does not require details for a non-other reason", () => {
    renderIt();
    fireEvent.click(screen.getByText("Not for me"));
    fireEvent.click(screen.getByText("Salary too low"));
    expect((screen.getByText("Skip this job") as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("JobListing: 'Other' requires details", () => {
  it("disables skip for blank details and enables + sends typed details", async () => {
    render(<JobListing job={ENTRY} openJobQuestionsDrawer={jest.fn()} />);
    fireEvent.click(screen.getByText("Skip"));
    fireEvent.click(screen.getByText("Other"));

    const skipBtn = screen.getByText("Skip Job") as HTMLButtonElement;
    expect(skipBtn.disabled).toBe(true);

    const textarea = screen.getByPlaceholderText("Please tell us more...");
    fireEvent.change(textarea, { target: { value: "   " } });
    expect(skipBtn.disabled).toBe(true);
    fireEvent.click(skipBtn);
    expect(mockMarkMatchAsSkipped).not.toHaveBeenCalled();

    fireEvent.change(textarea, { target: { value: "Needs relocation" } });
    expect(skipBtn.disabled).toBe(false);
    fireEvent.click(skipBtn);

    await waitFor(() => expect(mockMarkMatchAsSkipped).toHaveBeenCalledTimes(1));
    expect(mockMarkMatchAsSkipped).toHaveBeenCalledWith(
      "match-abc",
      "other",
      "Needs relocation"
    );
  });
});
