/**
 * Parses a skill string to extract the name and rating
 * Format: "Skill Name (8/10)" or just "Skill Name"
 */
export const parseSkill = (skill: string): { name: string; rating: number | null } => {
  const match = skill.match(/^(.+?)\s*\((\d+)\/10\)\s*$/);
  if (match) {
    return {
      name: match[1].trim(),
      rating: parseInt(match[2], 10),
    };
  }
  return {
    name: skill.trim(),
    rating: null,
  };
};

/**
 * Formats a skill name and rating into the standard format
 */
export const formatSkill = (name: string, rating: number | null): string => {
  if (rating !== null && rating >= 1 && rating <= 10) {
    return `${name} (${rating}/10)`;
  }
  return name;
};

/**
 * Extracts just the skill name from a formatted skill string
 */
export const getSkillName = (skill: string): string => {
  return parseSkill(skill).name;
};


