export type ExperienceItem = string | { text: string; link?: string };
export type ProjectItem = string | { text: string; link?: string };

export type Resume = {
  skills: string[];
  experience: ExperienceItem[];
  education: string[];
  certifications: string[];
  languages: string[];
  projects: ProjectItem[];
  achievements: string[];
  volunteerExperience: string[];
  interests: string[];
  summary: string;
};

export const normalizeExperienceItem = (item: ExperienceItem): { text: string; link?: string } => {
  if (typeof item === 'string') {
    return { text: item };
  }
  return item;
};

export const normalizeProjectItem = (item: ProjectItem): { text: string; link?: string } => {
  if (typeof item === 'string') {
    return { text: item };
  }
  return item;
};
