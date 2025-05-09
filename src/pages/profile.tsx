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
} from "@chakra-ui/react";
import { FaMapMarkerAlt, FaEnvelope, FaEdit, FaTrash } from "react-icons/fa";
import styled from "styled-components";

import DashboardLayout from "../components/Layout/DashboardLayout";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/User";

const StyledSkeleton = styled(Skeleton)`
  width: 100%;
  height: 300px;
  border-radius: 8px;
`;

// Mock user data
const mockUser = {
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  location: "San Francisco, CA",
  avatar: "https://i.pravatar.cc/300",
  skills: [
    "React",
    "TypeScript",
    "Node.js",
    "GraphQL",
    "UI/UX Design",
    "Chakra UI",
  ],
  experience: [
    {
      id: 1,
      position: "Senior Frontend Developer",
      company: "TechCorp Inc.",
      duration: "2020 - Present",
      description:
        "Lead frontend development for multiple projects using React and TypeScript.",
    },
    {
      id: 2,
      position: "UI Developer",
      company: "Design Studios",
      duration: "2018 - 2020",
      description:
        "Designed and implemented responsive web interfaces for client projects.",
    },
    {
      id: 3,
      position: "Junior Web Developer",
      company: "StartUp Hub",
      duration: "2016 - 2018",
      description:
        "Assisted in development of web applications using JavaScript and CSS.",
    },
  ],
};

const ProfilePage = () => {
  const { getUserProfile } = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const cardBg = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");

  useEffect(() => {
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

    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log("User data:", user);

  const handleEditExperience = (index: number) => {
    // Handle edit experience logic here
  };

  const handleDeleteExperience = (index: number) => {
    // Handle delete experience logic here
  };

  return (
    <DashboardLayout>
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
                      {user?.preferences?.location.join(", ") || "-"}(
                      {user?.preferences?.remoteOnly ? "Remote" : "On-site"})
                    </Text>
                  </HStack>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Heading as="h2" size="md" mb={4}>
                Skills ({user?.resume?.skills.length || 0})
              </Heading>
              <Box>
                {user?.resume?.skills.map((skill, index) => (
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
                    {skill}
                  </Badge>
                )) || (
                  <Text color={textColor}>
                    Update your skills by uploading a resume
                  </Text>
                )}
              </Box>
            </CardBody>
          </Card>
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Heading as="h2" size="md" mb={4}>
                Work Experience ({user?.resume?.experience.length || 0})
              </Heading>
              <VStack spacing={4} align="stretch">
                {user?.resume?.experience.map((exp, i) => (
                  <Box key={i}>
                    <HStack justify="space-between" my={1}>
                      <Text fontSize="sm" color={textColor}>
                        {exp}
                      </Text>
                      <HStack gap={4}>
                        <Icon
                          as={FaEdit}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleEditExperience(i)}
                          _hover={{ color: "blue.600" }}
                          title="Edit"
                        />
                        <Icon
                          as={FaTrash}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleDeleteExperience(i)}
                          _hover={{ color: "red.600" }}
                          title="Delete"
                        />
                      </HStack>
                    </HStack>
                    {i < (user?.resume?.experience.length || 0) && (
                      <Divider my={3} />
                    )}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Heading as="h2" size="md" mb={4}>
                Projects ({user?.resume?.projects.length || 0})
              </Heading>
              <VStack spacing={4} align="stretch">
                {user?.resume?.projects.map((exp, i) => (
                  <Box key={i}>
                    <HStack justify="space-between" my={1}>
                      <Text fontSize="sm" color={textColor}>
                        {exp}
                      </Text>
                      <HStack gap={4}>
                        <Icon
                          as={FaEdit}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleEditExperience(i)}
                          _hover={{ color: "blue.600" }}
                          title="Edit"
                        />
                        <Icon
                          as={FaTrash}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleDeleteExperience(i)}
                          _hover={{ color: "red.600" }}
                          title="Delete"
                        />
                      </HStack>
                    </HStack>
                    {i < (user?.resume?.projects.length || 0) && (
                      <Divider my={3} />
                    )}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Heading as="h2" size="md" mb={4}>
                Achievements ({user?.resume?.achievements.length || 0})
              </Heading>
              <VStack spacing={4} align="stretch">
                {user?.resume?.achievements.map((exp, i) => (
                  <Box key={i}>
                    <HStack justify="space-between" my={1}>
                      <Text fontSize="sm" color={textColor}>
                        {exp}
                      </Text>
                      <HStack gap={4}>
                        <Icon
                          as={FaEdit}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleEditExperience(i)}
                          _hover={{ color: "blue.600" }}
                          title="Edit"
                        />
                        <Icon
                          as={FaTrash}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleDeleteExperience(i)}
                          _hover={{ color: "red.600" }}
                          title="Delete"
                        />
                      </HStack>
                    </HStack>
                    {i < (user?.resume?.achievements.length || 0) && (
                      <Divider my={3} />
                    )}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Heading as="h2" size="md" mb={4}>
                Certifications ({user?.resume?.certifications.length || 0})
              </Heading>
              <VStack spacing={4} align="stretch">
                {user?.resume?.certifications.map((exp, i) => (
                  <Box key={i}>
                    <HStack justify="space-between" my={1}>
                      <Text fontSize="sm" color={textColor}>
                        {exp}
                      </Text>
                      <HStack gap={4}>
                        <Icon
                          as={FaEdit}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleEditExperience(i)}
                          _hover={{ color: "blue.600" }}
                          title="Edit"
                        />
                        <Icon
                          as={FaTrash}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleDeleteExperience(i)}
                          _hover={{ color: "red.600" }}
                          title="Delete"
                        />
                      </HStack>
                    </HStack>
                    {i < (user?.resume?.certifications.length || 0) && (
                      <Divider my={3} />
                    )}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Heading as="h2" size="md" mb={4}>
                Volunteer Experiences (
                {user?.resume?.volunteerExperience.length || 0})
              </Heading>
              <VStack spacing={4} align="stretch">
                {user?.resume?.volunteerExperience.map((exp, i) => (
                  <Box key={i}>
                    <HStack justify="space-between" my={1}>
                      <Text fontSize="sm" color={textColor}>
                        {exp}
                      </Text>
                      <HStack gap={4}>
                        <Icon
                          as={FaEdit}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleEditExperience(i)}
                          _hover={{ color: "blue.600" }}
                          title="Edit"
                        />
                        <Icon
                          as={FaTrash}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleDeleteExperience(i)}
                          _hover={{ color: "red.600" }}
                          title="Delete"
                        />
                      </HStack>
                    </HStack>
                    {i < (user?.resume?.volunteerExperience.length || 0) && (
                      <Divider my={3} />
                    )}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Heading as="h2" size="md" mb={4}>
                Interests ({user?.resume?.interests.length || 0})
              </Heading>
              <VStack spacing={4} align="stretch">
                {user?.resume?.interests.map((exp, i) => (
                  <Box key={i}>
                    <HStack justify="space-between" my={1}>
                      <Text fontSize="sm" color={textColor}>
                        {exp}
                      </Text>
                      <HStack gap={4}>
                        <Icon
                          as={FaEdit}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleEditExperience(i)}
                          _hover={{ color: "blue.600" }}
                          title="Edit"
                        />
                        <Icon
                          as={FaTrash}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleDeleteExperience(i)}
                          _hover={{ color: "red.600" }}
                          title="Delete"
                        />
                      </HStack>
                    </HStack>
                    {i < (user?.resume?.interests.length || 0) && (
                      <Divider my={3} />
                    )}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Heading as="h2" size="md" mb={4}>
                Languages ({user?.resume?.languages.length || 0})
              </Heading>
              <Box>
                {user?.resume?.languages.map((skill, index) => (
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
                    {skill}
                  </Badge>
                )) || (
                  <Text color={textColor}>
                    Update your skills by uploading a resume
                  </Text>
                )}
              </Box>
            </CardBody>
          </Card>
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Heading as="h2" size="md" mb={4}>
                Preferred Job Types ({user?.preferences?.jobTypes.length || 0})
              </Heading>
              <VStack spacing={4} align="stretch">
                {user?.preferences?.jobTypes.map((exp, i) => (
                  <Box key={i}>
                    <HStack justify="space-between" my={1}>
                      <Text fontSize="sm" color={textColor}>
                        {exp}
                      </Text>
                      <HStack gap={4}>
                        <Icon
                          as={FaEdit}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleEditExperience(i)}
                          _hover={{ color: "blue.600" }}
                          title="Edit"
                        />
                        <Icon
                          as={FaTrash}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleDeleteExperience(i)}
                          _hover={{ color: "red.600" }}
                          title="Delete"
                        />
                      </HStack>
                    </HStack>
                    {i < (user?.preferences?.jobTypes.length || 0) && (
                      <Divider my={3} />
                    )}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Heading as="h2" size="md" mb={4}>
                Locations ({user?.preferences?.location.length || 0})
              </Heading>
              <VStack spacing={4} align="stretch">
                {user?.preferences?.location.map((exp, i) => (
                  <Box key={i}>
                    <HStack justify="space-between" my={1}>
                      <Text fontSize="sm" color={textColor}>
                        {exp}
                      </Text>
                      <HStack gap={4}>
                        <Icon
                          as={FaEdit}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleEditExperience(i)}
                          _hover={{ color: "blue.600" }}
                          title="Edit"
                        />
                        <Icon
                          as={FaTrash}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleDeleteExperience(i)}
                          _hover={{ color: "red.600" }}
                          title="Delete"
                        />
                      </HStack>
                    </HStack>
                    {i < (user?.preferences?.location.length || 0) && (
                      <Divider my={3} />
                    )}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
          <Card bg={cardBg} shadow="md">
            <CardBody>
              <Heading as="h2" size="md" mb={4}>
                Industries Interested In (
                {user?.preferences?.industries.length || 0})
              </Heading>
              <VStack spacing={4} align="stretch">
                {user?.preferences?.industries.map((exp, i) => (
                  <Box key={i}>
                    <HStack justify="space-between" my={1}>
                      <Text fontSize="sm" color={textColor}>
                        {exp}
                      </Text>
                      <HStack gap={4}>
                        <Icon
                          as={FaEdit}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleEditExperience(i)}
                          _hover={{ color: "blue.600" }}
                          title="Edit"
                        />
                        <Icon
                          as={FaTrash}
                          color="blue.500"
                          boxSize={4}
                          cursor="pointer"
                          onClick={() => handleDeleteExperience(i)}
                          _hover={{ color: "red.600" }}
                          title="Delete"
                        />
                      </HStack>
                    </HStack>
                    {i < (user?.preferences?.industries.length || 0) && (
                      <Divider my={3} />
                    )}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      )}
    </DashboardLayout>
  );
};

export default ProfilePage;
