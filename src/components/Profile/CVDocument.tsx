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
});

interface CVDocumentProps {
  user: User;
}

export const CVDocument: React.FC<CVDocumentProps> = ({ user }) => {
  const resume = user.resume;
  const location = user.preferences?.location?.join(", ");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Name and Contact Information */}
        <View style={styles.header}>
          <Text style={styles.name}>{user.name || "Applicant"}</Text>
          {user.email && (
            <Text style={styles.contactInfo}>Email: {user.email}</Text>
          )}
          {user.phone && (
            <Text style={styles.contactInfo}>Phone: {user.phone}</Text>
          )}
          {location && (
            <Text style={styles.contactInfo}>Location: {location}</Text>
          )}
        </View>

        {/* Social Links Section */}
        {user.socialLinks &&
          (user.socialLinks.linkedin ||
            user.socialLinks.github ||
            user.socialLinks.portfolio ||
            user.socialLinks.website) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Professional Links</Text>
              {user.socialLinks.linkedin && (
                <Link src={user.socialLinks.linkedin} style={styles.link}>
                  LinkedIn: {user.socialLinks.linkedin}
                </Link>
              )}
              {user.socialLinks.github && (
                <Link src={user.socialLinks.github} style={styles.link}>
                  GitHub: {user.socialLinks.github}
                </Link>
              )}
              {user.socialLinks.portfolio && (
                <Link src={user.socialLinks.portfolio} style={styles.link}>
                  Portfolio: {user.socialLinks.portfolio}
                </Link>
              )}
              {user.socialLinks.website && (
                <Link src={user.socialLinks.website} style={styles.link}>
                  Website: {user.socialLinks.website}
                </Link>
              )}
            </View>
          )}

        {/* Summary/Objective Section */}
        {resume?.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
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
                <View key={index} style={{ marginBottom: 10 }}>
                  <Text style={styles.itemText}>{expText}</Text>
                  {expLink && (
                    <Link src={expLink} style={styles.link}>
                      {expLink}
                    </Link>
                  )}
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
        {resume?.skills && resume.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {resume.skills.map((skill, index) => {
                const parsed = parseSkill(skill);
                const skillText =
                  parsed.rating !== null
                    ? `${parsed.name} (${parsed.rating}/10)`
                    : parsed.name;
                return (
                  <Text key={index} style={styles.skill}>
                    {skillText}
                    {index < resume.skills.length - 1 ? " •" : ""}
                  </Text>
                );
              })}
            </View>
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
                <View key={index} style={{ marginBottom: 10 }}>
                  <Text style={styles.itemText}>{projectText}</Text>
                  {projectLink && (
                    <Link src={projectLink} style={styles.link}>
                      {projectLink}
                    </Link>
                  )}
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
            <View style={styles.skillsContainer}>
              {resume.languages.map((language, index) => (
                <Text key={index} style={styles.skill}>
                  {language}
                  {index < resume.languages.length - 1 ? " •" : ""}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Interests Section */}
        {resume?.interests && resume.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.skillsContainer}>
              {resume.interests.map((interest, index) => (
                <Text key={index} style={styles.skill}>
                  {interest}
                  {index < resume.interests.length - 1 ? " •" : ""}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default CVDocument;
