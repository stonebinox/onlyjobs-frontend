import {
  Box,
  SimpleGrid,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Alert,
  AlertIcon,
  HStack,
} from "@chakra-ui/react";
import {
  FiUsers,
  FiBriefcase,
  FiCheckCircle,
  FiTrendingUp,
  FiUpload,
  FiMessageSquare,
} from "react-icons/fi";

import DashboardLayout from "../../components/Layout/DashboardLayout";
import StatCard from "../../components/Dashboard/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { JobMatches } from "@/components/Dashboard/JobMatches";
import { QADrawer } from "@/components/Dashboard/QADrawer";

const Dashboard = () => {
  const [availableJobsCount, setAvailableJobsCount] = useState<number>(0);
  const [activeUserCount, setActiveUserCount] = useState<number>(0);
  const [matchCount, setMatchCount] = useState<number>(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const auth = useAuth();
  const router = useRouter();
  const { getAvailableJobsCount, getActiveUserCount, uploadCV, getMatchCount } =
    useApi();

  useEffect(() => {
    if (!auth?.isLoggedIn) {
      router.push("/");
    }

    const fetchAvailableJobsCount = async () => {
      try {
        const count: number = await getAvailableJobsCount();
        setAvailableJobsCount(count);
      } catch (error) {
        console.error("Error fetching available jobs count:", error);
      }
    };

    const fetchActiveUserCount = async () => {
      try {
        const count: number = await getActiveUserCount();
        setActiveUserCount(count);
      } catch (error) {
        console.error("Error fetching active user count:", error);
      }
    };

    const fetchMatchCount = async () => {
      try {
        const count: number = await getMatchCount();
        setMatchCount(count);
      } catch (error) {
        console.error("Error fetching match count:", error);
      }
    };

    fetchMatchCount();
    fetchActiveUserCount();
    fetchAvailableJobsCount();
  }, [
    auth?.isLoggedIn,
    getActiveUserCount,
    getAvailableJobsCount,
    getMatchCount,
    router,
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadedFile(file);
    setUploadSuccess(false);
    setUploadError(null);
  };

  const handleCVUpload = async () => {
    if (!uploadedFile) {
      setUploadError("Please select a file to upload");
      return;
    }

    // Check file type (PDF, DOC, DOCX)
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!validTypes.includes(uploadedFile.type)) {
      setUploadError("Please upload a PDF or Word document");

      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const response = await uploadCV(uploadedFile);
      if (!response) {
        setUploadError("Failed to upload CV. Please try again.");

        return;
      }

      if (response.error) {
        setUploadError(response.error);

        return;
      }

      setUploadSuccess(true);
      setUploadedFile(null);

      // Reset the file input (optional)
      const fileInput = document.getElementById(
        "cv-upload"
      ) as HTMLInputElement;

      if (fileInput) fileInput.value = "";

      setTimeout(() => {
        onClose();
        setUploadSuccess(false);
        setIsDrawerOpen(true); // we prompt users to update their Q&A
      }, 2000);
    } catch (error) {
      console.error("Error uploading CV:", error);
      setUploadError("Failed to upload CV. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <DashboardLayout>
        <Box>
          <Heading mb={5}>Dashboard</Heading>

          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 4 }}
            spacing={{ base: 5, lg: 8 }}
          >
            <StatCard
              title="Active Candidates"
              stat={new Intl.NumberFormat("en-US").format(activeUserCount)}
              icon={<FiUsers size="3em" />}
            />
            <StatCard
              title="Job Listings"
              stat={new Intl.NumberFormat("en-US").format(availableJobsCount)}
              icon={<FiBriefcase size="3em" />}
            />
            <StatCard
              title="Successful Matches"
              stat={new Intl.NumberFormat("en-US").format(matchCount)}
              icon={<FiCheckCircle size="3em" />}
            />
            <Box
              p={5}
              shadow="md"
              borderWidth="1px"
              borderRadius="lg"
              bg="white"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
            >
              <HStack gap={4} width={"100%"}>
                <Button
                  leftIcon={<FiTrendingUp size="1.5em" />}
                  colorScheme="blue"
                  variant="solid"
                  size="sm"
                  onClick={onOpen}
                  w="100%"
                >
                  Upload Your CV
                </Button>
                <Button
                  leftIcon={<FiMessageSquare size="1.5em" />}
                  colorScheme="blue"
                  variant="solid"
                  size="sm"
                  onClick={() => setIsDrawerOpen(true)}
                  w="100%"
                >
                  Update Q&amp;A
                </Button>
              </HStack>
              <Text fontSize="sm" mt={2} color="gray.500" textAlign="center">
                Improve your match rate
              </Text>
            </Box>
          </SimpleGrid>
          <Box mt={10}>
            <Tabs colorScheme="blue">
              <TabList>
                <Tab>Matches for you</Tab>
                <Tab>Skipped by you</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <JobMatches />
                </TabPanel>
                <TabPanel>
                  <Text>Recent candidates will appear here.</Text>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </Box>
      </DashboardLayout>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload Your CV</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {uploadSuccess && (
              <Alert status="success" mb={4}>
                <AlertIcon />
                CV uploaded successfully!
              </Alert>
            )}

            {uploadError && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                {uploadError}
              </Alert>
            )}

            <FormControl>
              <FormLabel htmlFor="cv-upload">
                Select your CV (PDF or Word document)
              </FormLabel>
              <Input
                id="cv-upload"
                type="file"
                py={1}
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
              <Text mt={2} fontSize="sm" color="gray.500">
                Supported formats: PDF, DOC, DOCX
              </Text>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCVUpload}
              isLoading={isUploading}
              loadingText="Uploading"
              leftIcon={<FiUpload />}
              isDisabled={!uploadedFile || uploadSuccess}
            >
              Upload
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <QADrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

export default Dashboard;
