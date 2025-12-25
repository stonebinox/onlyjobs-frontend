import React, { useEffect, useState } from "react";
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
} from "@chakra-ui/react";
import {
  FaMapMarkerAlt,
  FaEnvelope,
  FaEdit,
  FaTrash,
  FaDollarSign,
  FaPlus,
} from "react-icons/fa";
import styled from "styled-components";

import DashboardLayout from "../components/Layout/DashboardLayout";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/User";
import EditSummaryModal from "../components/Profile/EditSummaryModal";
import EditArrayItemModal from "../components/Profile/EditArrayItemModal";
import AddArrayItemModal from "../components/Profile/AddArrayItemModal";
import EditSkillsModal from "../components/Profile/EditSkillsModal";
import EditLanguagesModal from "../components/Profile/EditLanguagesModal";
import { parseSkill } from "@/utils/skillUtils";
import Guide from "@/components/Guide/Guide";
import { profileGuideConfig } from "@/config/guides/profileGuide";

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
  | "interests";

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

  const handleSaveArrayItem = async (value: string) => {
    if (!editingField || !user) return;

    const currentArray = user.resume?.[editingField] || [];
    if (editingIndex >= 0) {
      // Edit existing item
      const updatedArray = [...currentArray];
      updatedArray[editingIndex] = value;
      await handleUpdateResume({ [editingField]: updatedArray });
    } else {
      // Add new item
      await handleUpdateResume({ [editingField]: [...currentArray, value] });
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

  const getCurrentArrayItemValue = (): string => {
    if (!editingField || editingIndex < 0 || !user) return "";
    return user.resume?.[editingField]?.[editingIndex] || "";
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
    };
    return labels[field];
  };

  const renderArrayField = (
    field: ArrayFieldType,
    items: string[],
    label: string
  ) => {
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
          <VStack spacing={4} align="stretch">
            {items.length === 0 ? (
              <Text color={textColor} fontStyle="italic">
                No {label.toLowerCase()} added yet
              </Text>
            ) : (
              items.map((item, i) => (
                <Box key={i}>
                  <HStack justify="space-between" my={1}>
                    <Text fontSize="sm" color={textColor}>
                      {item}
                    </Text>
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
              ))
            )}
          </VStack>
        </CardBody>
      </Card>
    );
  };

  return (
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
                  user.resume.skills.map((skill, index) => {
                    const parsed = parseSkill(skill);
                    return (
                      <Badge
                        key={index}
                        mr={2}
                        mb={2}
                        colorScheme="blue"
                        variant="solid"
                        borderRadius="full"
                        px={3}
                        py={1}
                      >
                        {parsed.name}
                        {parsed.rating !== null && (
                          <Text as="span" opacity={0.8} fontSize="xs" ml={1}>
                            ({parsed.rating}/10)
                          </Text>
                        )}
                      </Badge>
                    );
                  })
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
                  user.resume.languages.map((language, index) => (
                    <Badge
                      key={index}
                      mr={2}
                      mb={2}
                      colorScheme="blue"
                      variant="solid"
                      borderRadius="full"
                      px={3}
                      py={1}
                    >
                      {language}
                    </Badge>
                  ))
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

      <EditArrayItemModal
        isOpen={editArrayItemModal.isOpen}
        onClose={() => {
          editArrayItemModal.onClose();
          setEditingField(null);
          setEditingIndex(-1);
        }}
        currentValue={getCurrentArrayItemValue()}
        fieldLabel={editingField ? getFieldLabel(editingField) : ""}
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
  );
};

export default ProfilePage;
