import { Step } from "react-joyride";

export const settingsGuideSteps: Step[] = [
  {
    target: "[data-guide='preferences-section']",
    content: "Set your job preferences here: job types, industries, locations, and salary expectations.",
    placement: "bottom",
    title: "Job Preferences",
  },
  {
    target: "[data-guide='match-score-setting']",
    content: "Adjust your minimum match score. Jobs below this score won't appear in your matches.",
    placement: "bottom",
    title: "Match Score Setting",
  },
  {
    target: "[data-guide='matching-toggle']",
    content: "Toggle job matching on or off. When enabled, we'll find jobs that match your profile.",
    placement: "bottom",
    title: "Job Matching",
  },
  {
    target: "[data-guide='email-settings']",
    content: "Update your email address or change your password here.",
    placement: "top",
    title: "Account Settings",
  },
];

export const settingsGuideConfig = {
  pageId: "settings",
  steps: settingsGuideSteps,
  showModal: true,
  modalTitle: "Configure Your Settings",
  modalContent: "Customize your job search preferences and account settings to get the best matches.",
};

