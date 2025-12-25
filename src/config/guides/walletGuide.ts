import { Step } from "react-joyride";

export const walletGuideSteps: Step[] = [
  {
    target: "[data-guide='wallet-balance']",
    content: "Your wallet balance shows how much credit you have. Some features may require a minimum balance.",
    placement: "bottom",
    title: "Wallet Balance",
  },
  {
    target: "[data-guide='top-up-button']",
    content: "Click here to add funds to your wallet using secure payment methods.",
    placement: "bottom",
    title: "Top Up Wallet",
  },
  {
    target: "[data-guide='transactions-table']",
    content: "View your transaction history including top-ups, payments, and refunds.",
    placement: "top",
    title: "Transaction History",
  },
];

export const walletGuideConfig = {
  pageId: "wallet",
  steps: walletGuideSteps,
  showModal: true,
  modalTitle: "Manage Your Wallet",
  modalContent: "Your wallet lets you pay for premium features. Let's see how to manage it.",
};

