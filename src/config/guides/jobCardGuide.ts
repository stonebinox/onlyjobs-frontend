import { Step } from "react-joyride";

export const jobCardGuideSteps: Step[] = [
  {
    target: "[data-guide='job-match-score']",
    content:
      "Match score shows how well this job fits your profile. Higher scores (70%+) indicate strong alignment with your skills, experience, and preferences.",
    placement: "top",
    title: "Match Score",
  },
  {
    target: "[data-guide='job-ai-reasoning']",
    content:
      "AI reasoning explains why this job matches you. It analyzes your skills, experience, and preferences to highlight the connection.",
    placement: "top",
    title: "AI Reasoning",
  },
  {
    target: "[data-guide='job-listing-health']",
    content:
      "Listing health: Fresh (posted <1 week), Warm (1-2 weeks), or Stale (>2 weeks). Fresher listings are more likely to be actively hiring.",
    placement: "top",
    title: "Listing Health",
  },
  {
    target: "[data-guide='job-application-help']",
    content:
      "Click here to see job-specific questions and get AI-generated answers. This helps you prepare tailored responses for your application.",
    placement: "left",
    title: "Application Help",
  },
];

export const jobCardGuideConfig = {
  pageId: "job-card",
  steps: jobCardGuideSteps,
  showModal: false,
};

