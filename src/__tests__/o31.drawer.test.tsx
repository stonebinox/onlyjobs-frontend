/**
 * GUARD TEST — onlyjobs-o31
 * Stray-divider fix: divider visibility must track the banner, not a separate parent condition.
 *
 * Oracle: divider exists only when the apply prompt exists.
 * A divider with no banner above it is a FINDING.
 */
/* eslint-disable react/display-name */

jest.mock("@/lib/apiClient", () => ({
  __esModule: true,
  createApiClient: () => ({
    markMatchApplied: jest.fn().mockResolvedValue({ success: true }),
  }),
}));

jest.mock("@/components/Dashboard/GenerateAnswer", () => ({
  __esModule: true,
  // eslint-disable-next-line react/display-name
  GenerateAnswer: () =>
    React.createElement("div", { "data-testid": "generate-answer-stub" }),
}));

jest.mock("@chakra-ui/react", () => {
  const React = require("react");
  const makeEl =
    (tag: string) =>
    ({ children, ...rest }: any) =>
      React.createElement(tag, rest, children);
  return {
    __esModule: true,
    Drawer: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    DrawerOverlay: ({ children }: any) =>
      React.createElement("div", null, children),
    DrawerContent: ({ children }: any) =>
      React.createElement("div", { role: "dialog" }, children),
    DrawerHeader: ({ children }: any) =>
      React.createElement("h2", null, children),
    DrawerBody: ({ children }: any) =>
      React.createElement("div", null, children),
    DrawerCloseButton: () => React.createElement("button", null, "Close"),
    VStack: ({ children }: any) => React.createElement("div", null, children),
    HStack: ({ children }: any) => React.createElement("div", null, children),
    Text: ({ children }: any) => React.createElement("span", null, children),
    Button: ({ children, onClick, isDisabled }: any) =>
      React.createElement(
        "button",
        { onClick, disabled: isDisabled || undefined },
        children
      ),
    Divider: () => React.createElement("hr"),
    Modal: ({ isOpen, children }: any) =>
      isOpen ? React.createElement(React.Fragment, null, children) : null,
    ModalOverlay: () => null,
    ModalContent: ({ children }: any) =>
      React.createElement("div", { role: "dialog" }, children),
    ModalHeader: ({ children }: any) =>
      React.createElement("h2", null, children),
    ModalBody: ({ children }: any) => React.createElement("div", null, children),
    ModalFooter: ({ children }: any) =>
      React.createElement("div", null, children),
    ModalCloseButton: () => React.createElement("button", null, "Close"),
    Textarea: makeEl("textarea"),
    Wrap: ({ children }: any) => React.createElement("div", null, children),
    WrapItem: ({ children }: any) => React.createElement("div", null, children),
    useDisclosure: () => {
      const [isOpen, setIsOpen] = React.useState(false);
      return {
        isOpen,
        onOpen: () => setIsOpen(true),
        onClose: () => setIsOpen(false),
      };
    },
    useBreakpointValue: (vals: any) => {
      if (vals && typeof vals === "object") {
        return vals.base ?? vals.sm ?? vals.md ?? Object.values(vals)[0];
      }
      return vals;
    },
  };
});

import React from "react";
import { render, screen } from "@testing-library/react";
import { JobQuestionsDrawer } from "@/components/Dashboard/JobQuestionsDrawer";
import type { JobResult } from "@/types/JobResult";

const makeJobResult = (overrides: Partial<JobResult> = {}): JobResult => ({
  _id: "jr-001",
  userId: "u1",
  jobId: "j1",
  matchScore: 75,
  verdict: "Strong Match",
  reasoning: "Good fit.",
  clicked: false,
  skipped: false,
  applied: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  job: {
    _id: "j1",
    title: "Engineer",
    company: "Acme",
    location: ["Remote"],
    salary: null as any,
    tags: [],
    source: "LinkedIn",
    description: "A job.",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    postedDate: "2024-01-01T00:00:00Z",
    scrapedDate: "2024-01-01T00:00:00Z",
    url: "https://example.com/job",
  },
  ...overrides,
});

describe("o31 — stray-divider guard: divider tracks banner visibility", () => {
  it("applied=null → apply prompt present AND divider present", () => {
    render(
      <JobQuestionsDrawer
        isOpen={true}
        onClose={jest.fn()}
        jobResult={makeJobResult({ applied: null })}
      />
    );

    // Prompt: "Did you apply" text or Yes/No buttons
    const applyPrompt =
      screen.queryByText(/did you apply/i) !== null ||
      screen.queryByRole("button", { name: /yes/i }) !== null;

    // Divider: Chakra Divider renders as <hr>, role="separator"
    const divider = document.querySelector("hr");

    // Oracle (from spec): when the apply prompt is visible, a divider must also be present
    expect(applyPrompt).toBe(true);
    expect(divider).not.toBeNull();
  });

  it("applied=true → NO apply prompt AND NO divider (stray-divider guard)", () => {
    render(
      <JobQuestionsDrawer
        isOpen={true}
        onClose={jest.fn()}
        jobResult={makeJobResult({ applied: true })}
      />
    );

    // No prompt when already answered
    const yesBtn = screen.queryByRole("button", { name: /yes/i });
    const noBtn = screen.queryByRole("button", { name: /no/i });
    const applyText = screen.queryByText(/did you apply/i);

    // No stray divider — this is the core o31 regression guard
    const divider = document.querySelector("hr");

    expect(yesBtn).toBeNull();
    expect(noBtn).toBeNull();
    expect(applyText).toBeNull();
    // FINDING if not null: the parent still renders a <Divider /> independently of the banner,
    // leaving a stray separator with no section above it.
    expect(divider).toBeNull();
  });
});
