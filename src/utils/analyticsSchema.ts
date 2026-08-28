export const PERSON_PROPERTY_KEYS = [
  "is_verified",
  "has_resume",
  "matching_enabled",
  "min_score",
] as const;

export type PersonPropertyKey = (typeof PERSON_PROPERTY_KEYS)[number];

export type PersonProperties = {
  is_verified: boolean;
  has_resume: boolean;
  matching_enabled?: boolean;
  min_score?: number;
};
