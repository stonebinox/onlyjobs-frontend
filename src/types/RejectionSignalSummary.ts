export type RejectionSignalSummary = {
  scope: "company" | "company_role" | "role" | "attribute";
  company: string;
  duration: "temporary" | "permanent";
  blockedUntil: string | null;
};
