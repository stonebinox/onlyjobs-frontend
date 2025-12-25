import { Step } from "react-joyride";

export const dashboardGuideSteps: Step[] = [
  {
    target: "[data-guide='stat-cards']",
    content:
      "These stat cards show your key metrics: available jobs in the last 30 days, successful matches for you, and options to upload your CV and answer Q&A questions.",
    placement: "bottom",
    title: "Dashboard Overview",
  },
  {
    target: "[data-guide='cv-upload-button']",
    content:
      "Upload your CV here. We extract relevant information (skills, experience, education) but don't store your file. A complete profile improves your match quality.",
    placement: "bottom",
    title: "Upload Your CV",
  },
  {
    target: "[data-guide='qa-button']",
    content:
      "Answer common interview questions to help our AI understand your preferences better. More answers = better job matches and higher match scores.",
    placement: "bottom",
    title: "Q&A Feature",
  },
  {
    target: "[data-guide='match-score-slider']",
    content:
      "Adjust the minimum match score to filter jobs. Higher scores mean better matches. We match you with jobs once every 24 hours based on your profile and preferences.",
    placement: "bottom",
    title: "Match Score Filter",
  },
  {
    target: "[data-guide='job-tabs']",
    content:
      "Switch between different job views: Matches, Applied, Viewed, and Skipped jobs.",
    placement: "bottom",
    title: "Job Tabs",
  },
  {
    target: "[data-guide='job-matches']",
    content:
      "Browse your job matches here. Each job card shows important details to help you decide.",
    placement: "top",
    title: "Job Matches",
  },
  {
    target: "[data-guide='job-match-score']",
    content:
      "Match score (0-100%) shows how well this job fits your profile. Higher scores (70%+) indicate strong alignment with your skills, experience, and preferences.",
    placement: "top",
    title: "Understanding Match Scores",
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
      "Listing health: Fresh (<1 week), Warm (1-2 weeks), or Stale (>2 weeks). Fresher listings are more likely to be actively hiring.",
    placement: "top",
    title: "Listing Health",
  },
  {
    target: "[data-guide='job-application-help']",
    content:
      "Click 'Get Application Help' to see job-specific questions and get AI-generated answers. This helps you prepare tailored responses for your application.",
    placement: "left",
    title: "Application Help",
  },
];

export const dashboardGuideConfig = {
  pageId: "dashboard",
  steps: dashboardGuideSteps,
  showModal: true,
  modalTitle: "Welcome to Your Dashboard!",
  modalContent:
    "We match you with jobs once daily. You're charged $0.30 only when we find at least one match. Complete your profile and answer Q&A questions to improve your match quality.",
};
