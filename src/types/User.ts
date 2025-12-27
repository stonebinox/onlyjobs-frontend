import { Preferences } from "./Preferences";
import { Resume } from "./Resume";

export type User = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  resume: Resume | null;
  preferences: Preferences | null;
  isVerified?: boolean;
  answeredQuestionsCount?: number;
};
