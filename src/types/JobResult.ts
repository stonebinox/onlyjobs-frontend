import { Job } from "./Job";

export type JobResult = {
  _id: string;
  userId: string;
  jobId: string;
  matchScore: number;
  verdict: string;
  reasoning: string;
  clicked: boolean;
  createdAt: string;
  updatedAt: string;
  skipped: boolean;
  job: Job | null;
};
