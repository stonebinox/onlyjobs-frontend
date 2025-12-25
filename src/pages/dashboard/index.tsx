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
  AlertTitle,
  AlertDescription,
  HStack,
} from "@chakra-ui/react";
import {
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
import { JobResult } from "@/types/JobResult";
import { VisitedJobs } from "@/components/Dashboard/VisitedJobs";
import { SkippedJobs } from "@/components/Dashboard/SkippedJobs";
import { AppliedJobs } from "@/components/Dashboard/AppliedJobs";
import { JobQuestionsDrawer } from "@/components/Dashboard/JobQuestionsDrawer";
import Guide from "@/components/Guide/Guide";
import { dashboardGuideConfig } from "@/config/guides/dashboardGuide";

const Dashboard = () => {
  const [availableJobsCount, setAvailableJobsCount] = useState<number>(0);
  const [matchCount, setMatchCount] = useState<number>(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isJobDrawerOpen, setIsJobDrawerOpen] = useState<boolean>(false);
  const [selectedJobResult, setSelectedJobResult] = useState<JobResult | null>(
    null
  );
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [showLowBalanceWarning, setShowLowBalanceWarning] = useState(false);
  const [pendingJobForDrawer, setPendingJobForDrawer] = useState<JobResult | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const auth = useAuth();
  const router = useRouter();
  const {
    getAvailableJobsCount,
    getActiveUserCount,
    uploadCV,
    getMatchCount,
    getMatches,
    checkWalletBalance,
  } = useApi();

  const fetchMatches = async (minScore: number = 65) => {
    try {
      setLoading(true);
      const response = await getMatches(minScore);

      if (response.error) {
        console.error("Error fetching matches:", response.error);
      } else {
        setJobs(response);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const openJobQuestionsDrawer = (jobResult: JobResult) => {
    setSelectedJobResult(jobResult);
    setIsJobDrawerOpen(true);
    // Clear pending job when drawer is manually opened
    if (pendingJobForDrawer?._id === jobResult._id) {
      setPendingJobForDrawer(null);
    }
  };

  const handleApplyClick = (jobResult: JobResult) => {
    // Store the job that was clicked for later drawer opening
    setPendingJobForDrawer(jobResult);
  };

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

    const fetchMatchCount = async () => {
      try {
        const count: number = await getMatchCount();
        setMatchCount(count);
      } catch (error) {
        console.error("Error fetching match count:", error);
      }
    };

    const fetchWalletBalance = async () => {
      try {
        const result = await checkWalletBalance();
        if (result && !("error" in result)) {
          setWalletBalance(result.balance);
          setShowLowBalanceWarning(!result.hasSufficientBalance);
        }
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
      }
    };

    fetchMatchCount();
    fetchAvailableJobsCount();
    fetchWalletBalance();
  }, [
    auth?.isLoggedIn,
    getActiveUserCount,
    getAvailableJobsCount,
    getMatchCount,
    checkWalletBalance,
    router,
  ]);

  // Handle page visibility change to auto-open drawer
  useEffect(() => {
    const handleVisibilityChange = () => {
      // When tab becomes visible and there's a pending job, open the drawer
      if (document.visibilityState === "visible" && pendingJobForDrawer) {
        // Only auto-open if drawer is not already open
        if (!isJobDrawerOpen) {
          setSelectedJobResult(pendingJobForDrawer);
          setIsJobDrawerOpen(true);
          // Clear pending job after opening drawer
          setPendingJobForDrawer(null);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pendingJobForDrawer, isJobDrawerOpen]);

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

    // Check file type (PDF, DOCX)
    const validTypes = [
      "application/pdf",
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
      <Guide
        pageId={dashboardGuideConfig.pageId}
        steps={dashboardGuideConfig.steps}
        showModal={dashboardGuideConfig.showModal}
        modalTitle={dashboardGuideConfig.modalTitle}
        modalContent={dashboardGuideConfig.modalContent}
      />
      <DashboardLayout>
        <Box>
          <Heading mb={5}>Dashboard</Heading>
          {showLowBalanceWarning && (
            <Alert status="warning" mb={5} borderRadius="md">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Low Wallet Balance</AlertTitle>
                <AlertDescription>
                  Your wallet balance is low. Please add funds to continue
                  receiving job matches.{" "}
                  <Text
                    as="span"
                    color="blue.500"
                    fontWeight="bold"
                    textDecoration="underline"
                    cursor="pointer"
                    onClick={() => router.push("/wallet")}
                  >
                    Go to Wallet
                  </Text>
                </AlertDescription>
              </Box>
            </Alert>
          )}
          <SimpleGrid
            columns={{ base: 1, md: 3, lg: 3 }}
            spacing={{ base: 4, lg: 8 }}
            data-guide="stat-cards"
          >
            <StatCard
              title="Job Listings (in the last 30 days)"
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
                  data-guide="cv-upload-button"
                >
                  Upload Your CV
                </Button>
                <Button
                  leftIcon={<FiMessageSquare size="1.5em" />}
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDrawerOpen(true)}
                  w="100%"
                  data-guide="qa-button"
                >
                  Q&amp;A
                </Button>
              </HStack>
              <Text fontSize="sm" mt={2} color="gray.500" textAlign="center">
                Improve your match rate
              </Text>
            </Box>
          </SimpleGrid>
          <Box mt={10} maxW={{ base: "100%", lg: "1200px" }} mx="auto">
            <Tabs colorScheme="blue">
              <TabList data-guide="job-tabs">
                <Tab>Matches for you</Tab>
                <Tab>Applied</Tab>
                <Tab>Viewed</Tab>
                <Tab>Skipped</Tab>
              </TabList>
              <TabPanels>
                <TabPanel px={0}>
                  <Box data-guide="job-matches">
                    <JobMatches
                      jobs={jobs}
                      loading={loading}
                      fetchMatches={fetchMatches}
                      openJobQuestionsDrawer={openJobQuestionsDrawer}
                      onApplyClick={handleApplyClick}
                    />
                  </Box>
                </TabPanel>
                <TabPanel px={0}>
                  <AppliedJobs
                    jobs={jobs}
                    loading={loading}
                    openJobQuestionsDrawer={openJobQuestionsDrawer}
                    onApplyClick={handleApplyClick}
                  />
                </TabPanel>
                <TabPanel px={0}>
                  <VisitedJobs
                    jobs={jobs}
                    loading={loading}
                    openJobQuestionsDrawer={openJobQuestionsDrawer}
                    onApplyClick={handleApplyClick}
                  />
                </TabPanel>
                <TabPanel px={0}>
                  <SkippedJobs
                    jobs={jobs}
                    loading={loading}
                    openJobQuestionsDrawer={openJobQuestionsDrawer}
                    onApplyClick={handleApplyClick}
                  />
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
                Supported formats: PDF, DOC, DOCX. We extract relevant information (skills, experience, education) but don't store your file.
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
      <JobQuestionsDrawer
        isOpen={isJobDrawerOpen}
        onClose={() => setIsJobDrawerOpen(false)}
        jobResult={selectedJobResult}
        onStatusUpdate={() => {
          // Refresh jobs list to get updated applied status
          fetchMatches();
        }}
      />
    </>
  );
};

export default Dashboard;
