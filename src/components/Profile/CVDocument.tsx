import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import { User } from "@/types/User";
import { parseSkill } from "@/utils/skillUtils";
import { ExperienceItem, ProjectItem } from "@/types/Resume";

// ATS-friendly styles - simple, clean, no complex formatting
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    color: "#000000",
  },
  // Header section
  header: {
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000000",
  },
  contactInfo: {
    fontSize: 10,
    marginBottom: 3,
    color: "#333333",
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 3,
  },
  contactItem: {
    fontSize: 10,
    color: "#333333",
  },
  contactSeparator: {
    fontSize: 10,
    color: "#999999",
    marginHorizontal: 4,
  },
  contactLink: {
    fontSize: 10,
    color: "#0066CC",
    textDecoration: "none",
  },
  // Section styles
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    borderBottom: "1 solid #000000",
    paddingBottom: 3,
    color: "#000000",
    textTransform: "uppercase",
  },
  // Content styles
  text: {
    fontSize: 11,
    marginBottom: 6,
    lineHeight: 1.4,
    color: "#000000",
  },
  listItem: {
    fontSize: 11,
    marginBottom: 6,
    marginLeft: 12,
    lineHeight: 1.4,
    color: "#000000",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  skill: {
    fontSize: 11,
    marginRight: 12,
    marginBottom: 6,
    color: "#000000",
  },
  link: {
    fontSize: 10,
    color: "#0000FF",
    textDecoration: "underline",
    marginBottom: 3,
  },
  entryLink: {
    fontSize: 11,
    color: "#0066CC",
    textDecoration: "none",
  },
  // Experience/Education item styles
  itemTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#000000",
  },
  itemText: {
    fontSize: 11,
    marginBottom: 6,
    lineHeight: 1.4,
    color: "#000000",
  },
  // Skills tiers
  tierRow: {
    marginBottom: 4,
    lineHeight: 1.4,
  },
  tierLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  tierSkills: {
    fontSize: 11,
    color: "#333333",
  },
  // Inline list for languages/interests
  inlineList: {
    fontSize: 11,
    lineHeight: 1.4,
    color: "#000000",
  },
});

// Extract hostname from URL, fallback to original if invalid
const getHostname = (url: string): string => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
};

interface CVDocumentProps {
  user: User;
}

export const CVDocument: React.FC<CVDocumentProps> = ({ user }) => {
  const resume = user.resume;
  const location = user.preferences?.location?.join(", ");

  // Build contact row elements
  const contactElements: React.ReactNode[] = [];
  if (user.email) {
    contactElements.push(
      <Link key="email" src={'mailto:' + user.email} style={styles.contactLink}>{user.email}</Link>
    );
  }
  if (user.socialLinks?.linkedin) {
    contactElements.push(
      <Link key="linkedin" src={user.socialLinks.linkedin} style={styles.contactLink}>
        {getHostname(user.socialLinks.linkedin)}
      </Link>
    );
  }
  if (user.socialLinks?.github) {
    contactElements.push(
      <Link key="github" src={user.socialLinks.github} style={styles.contactLink}>
        {getHostname(user.socialLinks.github)}
      </Link>
    );
  }
  if (user.socialLinks?.portfolio) {
    contactElements.push(
      <Link key="portfolio" src={user.socialLinks.portfolio} style={styles.contactLink}>
        {getHostname(user.socialLinks.portfolio)}
      </Link>
    );
  }
  if (user.socialLinks?.website) {
    contactElements.push(
      <Link key="website" src={user.socialLinks.website} style={styles.contactLink}>
        {getHostname(user.socialLinks.website)}
      </Link>
    );
  }
  if (location) {
    contactElements.push(
      <Text key="location" style={styles.contactItem}>{location}</Text>
    );
  }

  // Interleave separators between contact elements
  const contactRow = contactElements.reduce<React.ReactNode[]>((acc, el, i) => {
    if (i > 0) {
      acc.push(
        <Text key={`sep-${i}`} style={styles.contactSeparator}> | </Text>
      );
    }
    acc.push(el);
    return acc;
  }, []);

  // Build skills tiers
  const skillTiers = (() => {
    if (!resume?.skills || resume.skills.length === 0) return null;
    const expert: string[] = [];
    const proficient: string[] = [];
    const familiar: string[] = [];
    const other: string[] = [];

    for (const skill of resume.skills) {
      const parsed = parseSkill(skill);
      const r = parsed.rating;
      if (r !== null && r >= 8 && r <= 10) {
        expert.push(parsed.name);
      } else if (r !== null && r >= 6 && r <= 7) {
        proficient.push(parsed.name);
      } else if (r !== null && r >= 3 && r <= 5) {
        familiar.push(parsed.name);
      } else {
        other.push(parsed.name);
      }
    }

    return { expert, proficient, familiar, other };
  })();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Name and Contact Information */}
        <View style={styles.header}>
          <Text style={styles.name}>{user.name || "Applicant"}</Text>
          {contactRow.length > 0 && (
            <View style={styles.contactRow}>
              {contactRow}
            </View>
          )}
        </View>

        {/* Summary/Objective Section */}
        {resume?.summary && (
          <View style={styles.section}>
            <Text style={styles.text}>{resume.summary}</Text>
          </View>
        )}

        {/* Work Experience Section */}
        {resume?.experience && resume.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {resume.experience.map((exp: ExperienceItem, index: number) => {
              const expText = typeof exp === "string" ? exp : exp.text;
              const expLink = typeof exp === "string" ? undefined : exp.link;
              return (
                <View key={index} style={{ marginBottom: 4 }}>
                  <Text style={styles.itemText}>
                    {expText}
                    {expLink && (
                      <>
                        {"  "}
                        <Link src={expLink} style={styles.entryLink}>{getHostname(expLink)}</Link>
                      </>
                    )}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Education Section */}
        {resume?.education && resume.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {resume.education.map((edu, index) => (
              <View key={index} style={{ marginBottom: 10 }}>
                <Text style={styles.itemText}>{edu}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills Section */}
        {resume?.skills && resume.skills.length > 0 && skillTiers && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {skillTiers.expert.length > 0 && (
              <Text style={styles.tierRow}>
                <Text style={styles.tierLabel}>Expert</Text>
                <Text style={styles.tierSkills}>{": "}{skillTiers.expert.join(", ")}</Text>
              </Text>
            )}
            {skillTiers.proficient.length > 0 && (
              <Text style={styles.tierRow}>
                <Text style={styles.tierLabel}>Proficient</Text>
                <Text style={styles.tierSkills}>{": "}{skillTiers.proficient.join(", ")}</Text>
              </Text>
            )}
            {skillTiers.familiar.length > 0 && (
              <Text style={styles.tierRow}>
                <Text style={styles.tierLabel}>Familiar</Text>
                <Text style={styles.tierSkills}>{": "}{skillTiers.familiar.join(", ")}</Text>
              </Text>
            )}
            {skillTiers.other.length > 0 && (
              <Text style={styles.tierRow}>
                <Text style={styles.tierLabel}>Other</Text>
                <Text style={styles.tierSkills}>{": "}{skillTiers.other.join(", ")}</Text>
              </Text>
            )}
          </View>
        )}

        {/* Projects Section */}
        {resume?.projects && resume.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {resume.projects.map((project: ProjectItem, index: number) => {
              const projectText = typeof project === "string" ? project : project.text;
              const projectLink = typeof project === "string" ? undefined : project.link;
              return (
                <View key={index} style={{ marginBottom: 4 }}>
                  <Text style={styles.itemText}>
                    {projectText}
                    {projectLink && (
                      <>
                        {"  "}
                        <Link src={projectLink} style={styles.entryLink}>{getHostname(projectLink)}</Link>
                      </>
                    )}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Certifications Section */}
        {resume?.certifications && resume.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {resume.certifications.map((cert, index) => (
              <View key={index} style={{ marginBottom: 6 }}>
                <Text style={styles.itemText}>{cert}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Achievements Section */}
        {resume?.achievements && resume.achievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            {resume.achievements.map((achievement, index) => (
              <View key={index} style={{ marginBottom: 6 }}>
                <Text style={styles.itemText}>{achievement}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Volunteer Experience Section */}
        {resume?.volunteerExperience &&
          resume.volunteerExperience.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Volunteer Experience</Text>
              {resume.volunteerExperience.map((volunteer, index) => (
                <View key={index} style={{ marginBottom: 10 }}>
                  <Text style={styles.itemText}>{volunteer}</Text>
                </View>
              ))}
            </View>
          )}

        {/* Languages Section */}
        {resume?.languages && resume.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.inlineList}>{resume.languages.join(", ")}</Text>
          </View>
        )}

        {/* Interests Section */}
        {resume?.interests && resume.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <Text style={styles.inlineList}>{resume.interests.join(", ")}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default CVDocument;
