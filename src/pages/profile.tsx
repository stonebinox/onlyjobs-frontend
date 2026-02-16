import React, { useEffect, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Card,
  CardBody,
  Avatar,
  Divider,
  Icon,
  useColorModeValue,
  Skeleton,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useToast,
  Link,
} from "@chakra-ui/react";
import {
  FaMapMarkerAlt,
  FaEnvelope,
  FaEdit,
  FaTrash,
  FaDollarSign,
  FaPlus,
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaGlobe,
  FaBriefcase,
  FaPhone,
  FaDownload,
  FaExternalLinkAlt,
} from "react-icons/fa";
import styled from "styled-components";
import { CVDocument } from "../components/Profile/CVDocument";

// PDFDownloadLink must be loaded client-side only (not SSR)
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

import DashboardLayout from "../components/Layout/DashboardLayout";
import { useApi } from "@/hooks/useApi";
import { User, SocialLinks } from "@/types/User";
import {
  ExperienceItem,
  ProjectItem,
  normalizeExperienceItem,
  normalizeProjectItem,
} from "@/types/Resume";
import EditSummaryModal from "../components/Profile/EditSummaryModal";
import EditArrayItemModal from "../components/Profile/EditArrayItemModal";
import AddArrayItemModal from "../components/Profile/AddArrayItemModal";
import EditSkillsModal from "../components/Profile/EditSkillsModal";
import EditLanguagesModal from "../components/Profile/EditLanguagesModal";
import EditSocialLinksModal from "../components/Profile/EditSocialLinksModal";
import EditPersonalInfoModal from "../components/Profile/EditPersonalInfoModal";
import { parseSkill } from "@/utils/skillUtils";
import Guide from "@/components/Guide/Guide";
import { profileGuideConfig } from "@/config/guides/profileGuide";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem, SortableBadge } from "@/components/DragDrop";
import { arrayMove } from "@/utils/arrayUtils";

const StyledSkeleton = styled(Skeleton)`
  width: 100%;
  height: 300px;
  border-radius: 8px;
`;

type ArrayFieldType =
  | "experience"
  | "education"
  | "projects"
  | "achievements"
  | "certifications"
  | "volunteerExperience"
  | "interests"
  | "skills"
  | "languages";

const ProfilePage = () => {
  const { getUserProfile, updateUserProfile } = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const cardBg = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const toast = useToast();

  // Modal states
  const summaryModal = useDisclosure();
  const skillsModal = useDisclosure();
  const languagesModal = useDisclosure();
  const socialLinksModal = useDisclosure();
  const personalInfoModal = useDisclosure();
  const editArrayItemModal = useDisclosure();
  const addArrayItemModal = useDisclosure();
  const deleteConfirmModal = useDisclosure();

  // State for modals
  const [editingField, setEditingField] = useState<ArrayFieldType | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [deletingField, setDeletingField] = useState<ArrayFieldType | null>(
    null
  );
  const [deletingIndex, setDeletingIndex] = useState<number>(-1);

  // DnD sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await getUserProfile();
      setUser(response);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateResume = async (resumeUpdate: any) => {
    const response = await updateUserProfile(resumeUpdate);
    if (response.error) {
      throw new Error(response.error);
    }
    await fetchUserProfile();
  };

  // Summary handlers
  const handleEditSummary = () => {
    summaryModal.onOpen();
  };

  const handleSaveSummary = async (summary: string) => {
    await handleUpdateResume({ summary });
  };

  // Skills handlers
  const handleEditSkills = () => {
    skillsModal.onOpen();
  };

  const handleSaveSkills = async (skills: string[]) => {
    await handleUpdateResume({ skills });
  };

  // Languages handlers
  const handleEditLanguages = () => {
    languagesModal.onOpen();
  };

  const handleSaveLanguages = async (languages: string[]) => {
    await handleUpdateResume({ languages });
  };

  // Personal info handlers
  const handleEditPersonalInfo = () => {
    personalInfoModal.onOpen();
  };

  const handleSavePersonalInfo = async (name: string, phone: string) => {
    const response = await updateUserProfile(undefined, name, phone);
    if (response.error) {
      throw new Error(response.error);
    }
    await fetchUserProfile();
  };

  // Social links handlers
  const handleEditSocialLinks = () => {
    socialLinksModal.onOpen();
  };

  const handleSaveSocialLinks = async (socialLinks: SocialLinks) => {
    const response = await updateUserProfile(undefined, undefined, undefined, socialLinks);
    if (response.error) {
      throw new Error(response.error);
    }
    await fetchUserProfile();
  };

  // Array item handlers (experience, projects, etc.)
  const handleEditArrayItem = (field: ArrayFieldType, index: number) => {
    setEditingField(field);
    setEditingIndex(index);
    editArrayItemModal.onOpen();
  };

  const handleAddArrayItem = (field: ArrayFieldType) => {
    setEditingField(field);
    setEditingIndex(-1);
    addArrayItemModal.onOpen();
  };

  const handleSaveArrayItem = async (value: string, link?: string) => {
    if (!editingField || !user) return;

    const currentArray = user.resume?.[editingField] || [];
    // For experience and projects, support optional links
    const supportsLinks = editingField === "experience" || editingField === "projects";
    const newValue = supportsLinks && link ? { text: value, link } : value;

    if (editingIndex >= 0) {
      // Edit existing item
      const updatedArray = [...currentArray];
      updatedArray[editingIndex] = newValue;
      await handleUpdateResume({ [editingField]: updatedArray });
    } else {
      // Add new item
      await handleUpdateResume({ [editingField]: [...currentArray, newValue] });
    }
  };

  const handleDeleteArrayItem = (field: ArrayFieldType, index: number) => {
    setDeletingField(field);
    setDeletingIndex(index);
    deleteConfirmModal.onOpen();
  };

  const confirmDeleteArrayItem = async () => {
    if (!deletingField || deletingIndex < 0 || !user) return;

    const currentArray = user.resume?.[deletingField] || [];
    const updatedArray = currentArray.filter((_, i) => i !== deletingIndex);
    await handleUpdateResume({ [deletingField]: updatedArray });
    deleteConfirmModal.onClose();
    setDeletingField(null);
    setDeletingIndex(-1);
  };

  // Reorder handler for array fields
  const handleReorderArrayField = async (
    field: ArrayFieldType,
    oldIndex: number,
    newIndex: number
  ) => {
    if (!user || oldIndex === newIndex) return;

    const currentArray = user.resume?.[field] || [];
    const reorderedArray = arrayMove(currentArray, oldIndex, newIndex);

    // Optimistic update
    setUser({
      ...user,
      resume: user.resume
        ? { ...user.resume, [field]: reorderedArray }
        : null,
    });

    try {
      await handleUpdateResume({ [field]: reorderedArray });
      toast({
        title: "Order updated",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      // Revert on failure
      await fetchUserProfile();
      toast({
        title: "Reorder failed",
        description: "Failed to save the new order. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Generic drag end handler factory for array fields
  const createDragEndHandler = (field: ArrayFieldType, items: any[]) => {
    return (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((_, i) => `${field}-${i}` === active.id);
      const newIndex = items.findIndex((_, i) => `${field}-${i}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        handleReorderArrayField(field, oldIndex, newIndex);
      }
    };
  };

  const getCurrentArrayItemValue = (): string => {
    if (!editingField || editingIndex < 0 || !user) return "";
    const item = user.resume?.[editingField]?.[editingIndex];
    if (!item) return "";
    // Handle both string and object formats
    if (typeof item === "string") return item;
    return item.text || "";
  };

  const getCurrentArrayItemLink = (): string | undefined => {
    if (!editingField || editingIndex < 0 || !user) return undefined;
    const item = user.resume?.[editingField]?.[editingIndex];
    if (!item || typeof item === "string") return undefined;
    return item.link;
  };

  const fieldSupportsLinks = (field: ArrayFieldType | null): boolean => {
    return field === "experience" || field === "projects";
  };

  const getFieldLabel = (field: ArrayFieldType): string => {
    const labels: Record<ArrayFieldType, string> = {
      experience: "Work Experience",
      education: "Education",
      projects: "Project",
      achievements: "Achievement",
      certifications: "Certification",
      volunteerExperience: "Volunteer Experience",
      interests: "Interest",
      skills: "Skill",
      languages: "Language",
    };
    return labels[field];
  };

  const renderArrayField = (
    field: ArrayFieldType,
    items: (string | { text: string; link?: string })[],
    label: string
  ) => {
    const itemIds = items.map((_, i) => `${field}-${i}`);

    return (
      <Card bg={cardBg} shadow="md">
        <CardBody>
          <HStack justify="space-between" mb={4}>
            <Heading as="h2" size="md">
              {label} ({items.length})
            </Heading>
            <Button
              leftIcon={<FaPlus />}
              size="sm"
              onClick={() => handleAddArrayItem(field)}
            >
              Add
            </Button>
          </HStack>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={createDragEndHandler(field, items)}
          >
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              <VStack spacing={4} align="stretch">
                {items.length === 0 ? (
                  <Text color={textColor} fontStyle="italic">
                    No {label.toLowerCase()} added yet
                  </Text>
                ) : (
                  items.map((item, i) => {
                    const itemText = typeof item === "string" ? item : item.text;
                    const itemLink = typeof item === "string" ? undefined : item.link;
                    return (
                      <SortableItem key={`${field}-${i}`} id={`${field}-${i}`}>
                        <Box>
                          <HStack justify="space-between" my={1}>
                            <VStack align="flex-start" spacing={1} flex={1}>
                              <Text fontSize="sm" color={textColor}>
                                {itemText}
                              </Text>
                              {itemLink && (
                                <Link
                                  href={itemLink}
                                  isExternal
                                  color="blue.500"
                                  fontSize="xs"
                                  display="flex"
                                  alignItems="center"
                                  gap={1}
                                >
                                  <Icon as={FaExternalLinkAlt} boxSize={3} />
                                  {itemLink}
                                </Link>
                              )}
                            </VStack>
                            <HStack gap={4}>
                              <Icon
                                as={FaEdit}
                                color="blue.500"
                                boxSize={4}
                                cursor="pointer"
                                onClick={() => handleEditArrayItem(field, i)}
                                _hover={{ color: "blue.600" }}
                                title="Edit"
                              />
                              <Icon
                                as={FaTrash}
                                color="blue.500"
                                boxSize={4}
                                cursor="pointer"
                                onClick={() => handleDeleteArrayItem(field, i)}
                                _hover={{ color: "red.600" }}
                                title="Delete"
                              />
                            </HStack>
                          </HStack>
                          {i < items.length - 1 && <Divider my={3} />}
                        </Box>
                      </SortableItem>
                    );
                  })
                )}
              </VStack>
            </SortableContext>
          </DndContext>
        </CardBody>
      </Card>
    );
  };

  return (
    <>
      <Head>
        <title>Profile | OnlyJobs</title>
      </Head>
      <DashboardLayout>
        <Guide
        pageId={profileGuideConfig.pageId}
        steps={profileGuideConfig.steps}
        showModal={profileGuideConfig.showModal}
        modalTitle={profileGuideConfig.modalTitle}
        modalContent={profileGuideConfig.modalContent}
      />
      {loading && !user ? (
        <StyledSkeleton isLoaded={!loading} />
      ) : (
        <VStack spacing={6} align="stretch">
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <HStack justify="space-between" align="flex-start">
                <HStack spacing={6} align="center">
                  <Avatar size="xl" name={user?.name || "User"} />
                  <VStack align="flex-start" spacing={2}>
                    <Heading as="h1" size="lg">
                      {user?.name || "User"}
                    </Heading>
                    <HStack>
                      <Icon as={FaEnvelope} color={textColor} />
                      <Text color={textColor}>{user?.email || "-"}</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaPhone} color={textColor} />
                      <Text color={textColor}>{user?.phone || "-"}</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaMapMarkerAlt} color={textColor} />
                      <Text color={textColor}>
                        {user?.preferences?.location.join(", ") || "-"} (
                        {user?.preferences?.remoteOnly ? "Remote" : "On-site"})
                      </Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaDollarSign} color={textColor} />
                      <Text color={textColor}>
                        {user?.preferences?.minSalary || "-"}
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>
                <HStack spacing={2}>
                  {user && (
                    <PDFDownloadLink
                      document={<CVDocument user={user} />}
                      fileName={`${user.name || "resume"}-cv.pdf`}
                    >
                      {({ loading }) => (
                        <Button
                          leftIcon={<FaDownload />}
                          size="sm"
                          variant="outline"
                          isLoading={loading}
                          loadingText="Generating..."
                        >
                          Download CV
                        </Button>
                      )}
                    </PDFDownloadLink>
                  )}
                  <Button
                    leftIcon={<FaEdit />}
                    size="sm"
                    onClick={handleEditPersonalInfo}
                  >
                    Edit
                  </Button>
                </HStack>
              </HStack>
            </CardBody>
          </Card>

          {/* Social Links Card */}
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Heading as="h2" size="md">
                  Social Links
                </Heading>
                <Button
                  leftIcon={<FaEdit />}
                  size="sm"
                  onClick={handleEditSocialLinks}
                >
                  Edit
                </Button>
              </HStack>
              <VStack spacing={3} align="stretch">
                {user?.socialLinks?.linkedin && (
                  <HStack>
                    <Icon as={FaLinkedin} color="blue.600" boxSize={5} />
                    <Text
                      as="a"
                      href={user.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="blue.500"
                      _hover={{ textDecoration: "underline" }}
                      fontSize="sm"
                    >
                      {user.socialLinks.linkedin}
                    </Text>
                  </HStack>
                )}
                {user?.socialLinks?.github && (
                  <HStack>
                    <Icon as={FaGithub} color={textColor} boxSize={5} />
                    <Text
                      as="a"
                      href={user.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="blue.500"
                      _hover={{ textDecoration: "underline" }}
                      fontSize="sm"
                    >
                      {user.socialLinks.github}
                    </Text>
                  </HStack>
                )}
                {user?.socialLinks?.portfolio && (
                  <HStack>
                    <Icon as={FaBriefcase} color={textColor} boxSize={5} />
                    <Text
                      as="a"
                      href={user.socialLinks.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="blue.500"
                      _hover={{ textDecoration: "underline" }}
                      fontSize="sm"
                    >
                      {user.socialLinks.portfolio}
                    </Text>
                  </HStack>
                )}
                {user?.socialLinks?.twitter && (
                  <HStack>
                    <Icon as={FaTwitter} color="blue.400" boxSize={5} />
                    <Text
                      as="a"
                      href={user.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="blue.500"
                      _hover={{ textDecoration: "underline" }}
                      fontSize="sm"
                    >
                      {user.socialLinks.twitter}
                    </Text>
                  </HStack>
                )}
                {user?.socialLinks?.website && (
                  <HStack>
                    <Icon as={FaGlobe} color={textColor} boxSize={5} />
                    <Text
                      as="a"
                      href={user.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="blue.500"
                      _hover={{ textDecoration: "underline" }}
                      fontSize="sm"
                    >
                      {user.socialLinks.website}
                    </Text>
                  </HStack>
                )}
                {(!user?.socialLinks ||
                  (!user.socialLinks.linkedin &&
                    !user.socialLinks.github &&
                    !user.socialLinks.portfolio &&
                    !user.socialLinks.twitter &&
                    !user.socialLinks.website)) && (
                  <Text color={textColor} fontStyle="italic">
                    No social links added yet
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Resume Summary Card */}
          <Card bg={cardBg} shadow="md" data-guide="profile-summary">
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Heading as="h2" size="md">
                  Resume Summary
                </Heading>
                <Button
                  leftIcon={<FaEdit />}
                  size="sm"
                  onClick={handleEditSummary}
                >
                  Edit
                </Button>
              </HStack>
              <Box>
                {user?.resume?.summary ? (
                  <Text color={textColor}>{user.resume.summary}</Text>
                ) : (
                  <Text color={textColor} fontStyle="italic">
                    No summary available. Add a summary to your resume to
                    provide an overview of your skills and experience.
                  </Text>
                )}
              </Box>
            </CardBody>
          </Card>

          {/* Skills Card */}
          <Card bg={cardBg} shadow="md" data-guide="profile-skills">
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Heading as="h2" size="md">
                  Skills ({user?.resume?.skills.length || 0})
                </Heading>
                <Button
                  leftIcon={<FaEdit />}
                  size="sm"
                  onClick={handleEditSkills}
                >
                  Edit
                </Button>
              </HStack>
              <Box>
                {user?.resume?.skills && user.resume.skills.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event: DragEndEvent) => {
                      const { active, over } = event;
                      if (!over || active.id === over.id || !user) return;

                      const skills = user.resume?.skills || [];
                      const oldIndex = skills.findIndex((_, i) => `skill-${i}` === active.id);
                      const newIndex = skills.findIndex((_, i) => `skill-${i}` === over.id);

                      if (oldIndex !== -1 && newIndex !== -1) {
                        handleReorderArrayField("skills" as ArrayFieldType, oldIndex, newIndex);
                      }
                    }}
                  >
                    <SortableContext
                      items={user.resume.skills.map((_, i) => `skill-${i}`)}
                      strategy={rectSortingStrategy}
                    >
                      {user.resume.skills.map((skill, index) => {
                        const parsed = parseSkill(skill);
                        return (
                          <SortableBadge key={`skill-${index}`} id={`skill-${index}`} colorScheme="blue">
                            {parsed.name}
                            {parsed.rating !== null && (
                              <Text as="span" opacity={0.8} fontSize="xs" ml={1}>
                                ({parsed.rating}/10)
                              </Text>
                            )}
                          </SortableBadge>
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                ) : (
                  <Text color={textColor} fontStyle="italic">
                    No skills added yet
                  </Text>
                )}
              </Box>
            </CardBody>
          </Card>

          {/* Work Experience */}
          <Box data-guide="profile-experience">
            {renderArrayField(
              "experience",
              user?.resume?.experience || [],
              "Work Experience"
            )}
          </Box>

          {/* Education */}
          <Box data-guide="profile-education">
            {renderArrayField(
              "education",
              user?.resume?.education || [],
              "Education"
            )}
          </Box>

          {/* Projects */}
          {renderArrayField(
            "projects",
            user?.resume?.projects || [],
            "Projects"
          )}

          {/* Achievements */}
          {renderArrayField(
            "achievements",
            user?.resume?.achievements || [],
            "Achievements"
          )}

          {/* Certifications */}
          {renderArrayField(
            "certifications",
            user?.resume?.certifications || [],
            "Certifications"
          )}

          {/* Volunteer Experience */}
          {renderArrayField(
            "volunteerExperience",
            user?.resume?.volunteerExperience || [],
            "Volunteer Experiences"
          )}

          {/* Interests */}
          {renderArrayField(
            "interests",
            user?.resume?.interests || [],
            "Interests"
          )}

          {/* Languages Card */}
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Heading as="h2" size="md">
                  Languages ({user?.resume?.languages.length || 0})
                </Heading>
                <Button
                  leftIcon={<FaEdit />}
                  size="sm"
                  onClick={handleEditLanguages}
                >
                  Edit
                </Button>
              </HStack>
              <Box>
                {user?.resume?.languages && user.resume.languages.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event: DragEndEvent) => {
                      const { active, over } = event;
                      if (!over || active.id === over.id || !user) return;

                      const languages = user.resume?.languages || [];
                      const oldIndex = languages.findIndex((_, i) => `language-${i}` === active.id);
                      const newIndex = languages.findIndex((_, i) => `language-${i}` === over.id);

                      if (oldIndex !== -1 && newIndex !== -1) {
                        handleReorderArrayField("languages" as ArrayFieldType, oldIndex, newIndex);
                      }
                    }}
                  >
                    <SortableContext
                      items={user.resume.languages.map((_, i) => `language-${i}`)}
                      strategy={rectSortingStrategy}
                    >
                      {user.resume.languages.map((language, index) => (
                        <SortableBadge key={`language-${index}`} id={`language-${index}`} colorScheme="blue">
                          {language}
                        </SortableBadge>
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  <Text color={textColor} fontStyle="italic">
                    No languages added yet
                  </Text>
                )}
              </Box>
            </CardBody>
          </Card>

          {/* Preferred Job Types */}
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Heading as="h2" size="md" mb={4}>
                Preferred Job Types ({user?.preferences?.jobTypes.length || 0})
              </Heading>
              <VStack spacing={4} align="stretch">
                {user?.preferences?.jobTypes &&
                user.preferences.jobTypes.length > 0 ? (
                  user.preferences.jobTypes.map((jobType, i) => (
                    <Box key={i}>
                      <Text fontSize="sm" color={textColor}>
                        {jobType}
                      </Text>
                      {i < (user.preferences?.jobTypes?.length || 0) - 1 && (
                        <Divider my={3} />
                      )}
                    </Box>
                  ))
                ) : (
                  <Text color={textColor} fontStyle="italic">
                    No job types specified
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Industries Interested In */}
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Heading as="h2" size="md" mb={4}>
                Industries Interested In (
                {user?.preferences?.industries.length || 0})
              </Heading>
              <VStack spacing={4} align="stretch">
                {user?.preferences?.industries &&
                user.preferences.industries.length > 0 ? (
                  user.preferences.industries.map((industry, i) => (
                    <Box key={i}>
                      <Text fontSize="sm" color={textColor}>
                        {industry}
                      </Text>
                      {i < (user.preferences?.industries?.length || 0) - 1 && (
                        <Divider my={3} />
                      )}
                    </Box>
                  ))
                ) : (
                  <Text color={textColor} fontStyle="italic">
                    No industries specified
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      )}

      {/* Modals */}
      <EditSummaryModal
        isOpen={summaryModal.isOpen}
        onClose={summaryModal.onClose}
        currentSummary={user?.resume?.summary || ""}
        onSave={handleSaveSummary}
      />

      <EditSkillsModal
        isOpen={skillsModal.isOpen}
        onClose={skillsModal.onClose}
        currentSkills={user?.resume?.skills || []}
        onSave={handleSaveSkills}
      />

      <EditLanguagesModal
        isOpen={languagesModal.isOpen}
        onClose={languagesModal.onClose}
        currentLanguages={user?.resume?.languages || []}
        onSave={handleSaveLanguages}
      />

      <EditPersonalInfoModal
        isOpen={personalInfoModal.isOpen}
        onClose={personalInfoModal.onClose}
        currentName={user?.name || ""}
        currentPhone={user?.phone || ""}
        onSave={handleSavePersonalInfo}
      />

      <EditSocialLinksModal
        isOpen={socialLinksModal.isOpen}
        onClose={socialLinksModal.onClose}
        currentSocialLinks={user?.socialLinks || {}}
        onSave={handleSaveSocialLinks}
      />

      <EditArrayItemModal
        isOpen={editArrayItemModal.isOpen}
        onClose={() => {
          editArrayItemModal.onClose();
          setEditingField(null);
          setEditingIndex(-1);
        }}
        currentValue={getCurrentArrayItemValue()}
        currentLink={getCurrentArrayItemLink()}
        fieldLabel={editingField ? getFieldLabel(editingField) : ""}
        supportsLink={fieldSupportsLinks(editingField)}
        onSave={handleSaveArrayItem}
      />

      <AddArrayItemModal
        isOpen={addArrayItemModal.isOpen}
        onClose={() => {
          addArrayItemModal.onClose();
          setEditingField(null);
          setEditingIndex(-1);
        }}
        fieldLabel={editingField ? getFieldLabel(editingField) : ""}
        supportsLink={fieldSupportsLinks(editingField)}
        onSave={handleSaveArrayItem}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmModal.isOpen}
        onClose={deleteConfirmModal.onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to delete this{" "}
              {deletingField
                ? getFieldLabel(deletingField).toLowerCase()
                : "item"}
              ? This action cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              mr={3}
              onClick={deleteConfirmModal.onClose}
            >
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmDeleteArrayItem}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      </DashboardLayout>
    </>
  );
};

export default ProfilePage;
