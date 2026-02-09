import { Preferences } from "./Preferences";
import { Resume } from "./Resume";

export type SocialLinks = {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  twitter?: string;
  website?: string;
};

export type User = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: Date;
  resume: Resume | null;
  preferences: Preferences | null;
  isVerified?: boolean;
  answeredQuestionsCount?: number;
  socialLinks?: SocialLinks;
};
