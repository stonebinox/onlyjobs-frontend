import { Step } from "react-joyride";

export const profileGuideSteps: Step[] = [
  {
    target: "[data-guide='profile-summary']",
    content:
      "Your professional summary gives employers a quick overview of your background and skills.",
    placement: "bottom",
    title: "Professional Summary",
  },
  {
    target: "[data-guide='profile-skills']",
    content:
      "Add and manage your skills here. These help match you with relevant job opportunities. Be sure to assign a rating for yourself per skill!",
    placement: "bottom",
    title: "Skills Section",
  },
  {
    target: "[data-guide='profile-experience']",
    content:
      "List your work experience. Click the edit icon to add or modify entries.",
    placement: "top",
    title: "Work Experience",
  },
  {
    target: "[data-guide='profile-education']",
    content: "Add your educational background to complete your profile.",
    placement: "top",
    title: "Education",
  },
];

export const profileGuideConfig = {
  pageId: "profile",
  steps: profileGuideSteps,
  showModal: true,
  modalTitle: "Complete Your Profile",
  modalContent:
    "A complete profile helps us match you with better job opportunities. Let's walk through the key sections.",
};
