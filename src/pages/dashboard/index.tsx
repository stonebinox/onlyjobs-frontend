import Head from "next/head";
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
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { EmailVerificationBanner } from "@/components/Dashboard/EmailVerificationBanner";
import { ResumeRequiredBanner } from "@/components/Dashboard/ResumeRequiredBanner";
import { QnARecommendationBanner } from "@/components/Dashboard/QnARecommendationBanner";
import { NoQnABanner } from "@/components/Dashboard/NoQnABanner";
import {
  FiBriefcase,
  FiCheckCircle,
  FiTrendingUp,
  FiUpload,
  FiMessageSquare,
} from "react-icons/fi";
import { User } from "@/types/User";

import { trackEvent } from "@/utils/analytics";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import StatCard from "../../components/Dashboard/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createApiClient } from "@/lib/apiClient";
import { JobMatches } from "@/components/Dashboard/JobMatches";
import { QADrawer } from "@/components/Dashboard/QADrawer";
import { JobResult } from "@/types/JobResult";
import { VisitedJobs } from "@/components/Dashboard/VisitedJobs";
import { SkippedJobs } from "@/components/Dashboard/SkippedJobs";
import { AppliedJobs } from "@/components/Dashboard/AppliedJobs";
import { JobQuestionsDrawer } from "@/components/Dashboard/JobQuestionsDrawer";
import Guide from "@/components/Guide/Guide";
import { dashboardGuideConfig } from "@/config/guides/dashboardGuide";
import { GettingStartedChecklist } from "@/components/Dashboard/GettingStartedChecklist";
import { AllJobsTab } from "@/components/AllJobsTab";

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
  const [tabIndex, setTabIndex] = useState(0);
  const [autoLaunchFollowup, setAutoLaunchFollowup] = useState(false);
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [showLowBalanceWarning, setShowLowBalanceWarning] = useState(false);
  const [pendingJobForDrawer, setPendingJobForDrawer] =
    useState<JobResult | null>(null);
  const [currentMinScore, setCurrentMinScore] = useState<number>(30);
  const [pendingFirstMatch, setPendingFirstMatch] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const auth = useAuth();
  const router = useRouter();
  const toast = useToast();
  const {
    getAvailableJobsCount,
    getActiveUserCount,
    uploadCV,
    getMatchCount,
    getMatches,
    checkWalletBalance,
    getUserProfile,
    triggerMatchForMe,
  } = createApiClient();

  const fetchMatches = async (minScore: number = 30) => {
    try {
      setLoading(true);
      const response = await getMatches(minScore);

      if (response.error) {
        console.error("Error fetching matches:", response.error);
      } else {
        setJobs(response);
        // Track first time user views matches this session
        if (response.length > 0 && !sessionStorage.getItem("oj_first_match_viewed")) {
          sessionStorage.setItem("oj_first_match_viewed", "1");
          trackEvent("first_match_viewed");
        }
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
    if (!auth?.isReady) return;

    if (!auth?.isLoggedIn) {
      const returnTo = window.location.pathname + window.location.search;
      sessionStorage.setItem('onlyjobs_returnTo', returnTo);
      router.push(`/?returnTo=${encodeURIComponent(returnTo)}`);
      return;
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

    const fetchUserProfile = async () => {
      try {
        const userData = await getUserProfile();
        if (userData && !("error" in userData)) {
          const typedUser = userData as User;
          setUser(typedUser);
          const savedMinScore = typedUser.preferences?.minScore ?? 30;
          setCurrentMinScore(savedMinScore);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchMatchCount();
    fetchAvailableJobsCount();
    fetchWalletBalance();
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.isReady, auth?.isLoggedIn]);

  // Handle follow-up redirect from email
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "applied") {
      setTabIndex(1);
    }
    if (params.get("followup") === "true") {
      setTabIndex(1);
      setAutoLaunchFollowup(true);
    }
  }, []);

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

    // Check file type (PDF, DOCX only — DOC not supported by backend parser)
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!validTypes.includes(uploadedFile.type)) {
      setUploadError("Unsupported file type. Please upload a PDF or DOCX file.");

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
      trackEvent("cv_uploaded");

      const fileInput = document.getElementById("cv-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // After CV upload, open Q&A in onboarding mode — match fires when done
      setTimeout(() => {
        onClose();
        setUploadSuccess(false);
        setPendingFirstMatch(true);
        setIsDrawerOpen(true);
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
      <Head>
        <title>Dashboard | OnlyJobs</title>
      </Head>
      <Guide
        pageId={dashboardGuideConfig.pageId}
        steps={dashboardGuideConfig.steps}
        showModal={dashboardGuideConfig.showModal}
        modalTitle={dashboardGuideConfig.modalTitle}
        modalContent={dashboardGuideConfig.modalContent}
      />
      <DashboardLayout>
        <Box>
          {user && (
            <>
              <GettingStartedChecklist
                user={user}
                walletBalance={walletBalance}
                onUploadCV={onOpen}
                onStartQnA={() => setIsDrawerOpen(true)}
              />
              <EmailVerificationBanner
                isVerified={user.isVerified ?? false}
                email={user.email}
                onVerificationSent={() => {
                  // Refresh user profile to check if verification status changed
                  getUserProfile().then((userData) => {
                    if (userData && !("error" in userData)) {
                      setUser(userData as User);
                    }
                  });
                }}
              />
              <ResumeRequiredBanner
                resume={user.resume}
                onUploadClick={onOpen}
              />
              <QnARecommendationBanner
                answeredQuestionsCount={user.answeredQuestionsCount ?? 0}
                resume={user.resume}
                onStartQnA={() => setIsDrawerOpen(true)}
              />
              <NoQnABanner
                answeredQuestionsCount={user.answeredQuestionsCount ?? 0}
                resume={user.resume}
                onStartQnA={() => setIsDrawerOpen(true)}
              />
            </>
          )}
          {showLowBalanceWarning && (
            <Alert status="warning" mb={user && !user.isVerified ? 4 : 5} borderRadius="xl">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Low Wallet Balance</AlertTitle>
                <AlertDescription>
                  Your wallet balance is low. Please add funds to continue
                  receiving job matches.{" "}
                  <Text
                    as="span"
                    color="primary.600"
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
          <Heading mb={6} fontFamily="heading" fontSize={{ base: "2xl", md: "3xl" }}>
            Dashboard
          </Heading>
          <SimpleGrid
            columns={{ base: 1, md: 3, lg: 3 }}
            spacing={{ base: 4, lg: 6 }}
            data-guide="stat-cards"
          >
            <StatCard
              title="Job Listings (15 days)"
              stat={new Intl.NumberFormat("en-US").format(availableJobsCount)}
              icon={<FiBriefcase size="1.5em" />}
              accentColor="accent.500"
            />
            <StatCard
              title="Successful Matches"
              stat={new Intl.NumberFormat("en-US").format(matchCount)}
              icon={<FiCheckCircle size="1.5em" />}
              accentColor="match.strong"
            />
            <Box
              position="relative"
              p={5}
              borderRadius="2xl"
              border="1px solid"
              borderColor="surface.border"
              bg="surface.card"
              boxShadow="card"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              overflow="hidden"
              _hover={{
                boxShadow: "cardHover",
                borderColor: "primary.200",
              }}
            >
              {/* Top accent bar */}
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                height="4px"
                bgGradient="linear(135deg, primary.500, secondary.500)"
              />
              <HStack gap={3} width="100%">
                <Button
                  leftIcon={<FiTrendingUp size="1.2em" />}
                  colorScheme="blue"
                  variant="solid"
                  size="sm"
                  onClick={onOpen}
                  w="100%"
                  data-guide="cv-upload-button"
                >
                  Upload CV
                </Button>
                <Button
                  leftIcon={<FiMessageSquare size="1.2em" />}
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
              <Text fontSize="xs" mt={3} color="text.tertiary" textAlign="center" fontWeight="medium">
                Improve your match rate
              </Text>
            </Box>
          </SimpleGrid>
          <Box mt={10} maxW={{ base: "100%", lg: "1200px" }} mx="auto">
            <Tabs colorScheme="purple" variant="line" index={tabIndex} onChange={setTabIndex}>
              <TabList data-guide="job-tabs" gap={2}>
                <Tab fontWeight="semibold" px={4}>Matches for you</Tab>
                <Tab fontWeight="semibold" px={4}>Applied</Tab>
                <Tab fontWeight="semibold" px={4}>Viewed</Tab>
                <Tab fontWeight="semibold" px={4}>Skipped</Tab>
                {user?.isVerified && (
                  <Tab fontWeight="semibold" px={4}>All Jobs</Tab>
                )}
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
                      initialMinScore={user?.preferences?.minScore ?? 30}
                      onMinScoreChange={setCurrentMinScore}
                    />
                    {!loading && jobs.length === 0 && (
                      <Box
                        textAlign="center"
                        py={12}
                        px={4}
                        borderRadius="2xl"
                        bg="surface.card"
                        border="1px dashed"
                        borderColor="surface.border"
                        mt={4}
                      >
                        <Spinner size="sm" color="primary.400" mb={3} />
                        <Heading size="sm" color="text.primary" mb={2}>
                          Your matches are on their way
                        </Heading>
                        <Text color="text.secondary" fontSize="sm" maxW="360px" mx="auto">
                          Matching runs nightly around 3 AM UTC. Upload your CV and complete your Q&amp;A to ensure the best results. New accounts get a first match run shortly after uploading.
                        </Text>
                      </Box>
                    )}
                  </Box>
                </TabPanel>
                <TabPanel px={0}>
                  <AppliedJobs
                    jobs={jobs}
                    loading={loading}
                    openJobQuestionsDrawer={openJobQuestionsDrawer}
                    onApplyClick={handleApplyClick}
                    autoLaunchFollowup={autoLaunchFollowup}
                    onFollowupLaunchHandled={() => setAutoLaunchFollowup(false)}
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
                {user?.isVerified && (
                  <TabPanel px={0}>
                    <AllJobsTab user={user} walletBalance={walletBalance} openJobQuestionsDrawer={openJobQuestionsDrawer} onApplyClick={handleApplyClick} onBalanceChange={(newBalance) => setWalletBalance(newBalance)} />
                  </TabPanel>
                )}
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
              <Alert status="error" mb={4} borderRadius="lg">
                <AlertIcon />
                <Box flex={1}>
                  <AlertTitle fontSize="sm">Upload failed</AlertTitle>
                  <AlertDescription fontSize="sm">
                    {uploadError.includes("10mb") || uploadError.toLowerCase().includes("large")
                      ? "File is too large. Please upload a file under 10 MB."
                      : uploadError.includes("type") || uploadError.toLowerCase().includes("format")
                      ? "Unsupported file type. Please upload a PDF or DOCX file."
                      : uploadError}
                  </AlertDescription>
                  <Button
                    size="xs"
                    mt={2}
                    variant="outline"
                    colorScheme="red"
                    onClick={() => { setUploadError(null); setUploadedFile(null); }}
                  >
                    Try again
                  </Button>
                </Box>
              </Alert>
            )}

            <FormControl>
              <FormLabel htmlFor="cv-upload">
                Select your CV (PDF or DOCX)
              </FormLabel>
              <Input
                id="cv-upload"
                type="file"
                py={1}
                accept=".pdf,.docx"
                onChange={handleFileChange}
              />
              <Text mt={2} fontSize="sm" color="gray.500">
                Supported formats: PDF, DOCX (max 10 MB). We extract skills, experience, and education — your file is not stored.
              </Text>
              <Text mt={1} fontSize="xs" color="gray.400">
                Having trouble?{" "}
                <Text as="span" color="blue.500" cursor="pointer" textDecoration="underline" onClick={() => router.push("/profile")}>
                  Paste your CV text in your profile instead
                </Text>
                .
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
      <QADrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onboardingMode={pendingFirstMatch}
        onComplete={() => {
          setPendingFirstMatch(false);
          triggerMatchForMe().then((result) => {
            if (!result.error) {
              toast({
                title: "Finding your matches",
                description: "Results will appear in your dashboard in a few minutes.",
                status: "info",
                duration: 6000,
                isClosable: true,
              });
            }
          });
        }}
      />
      <JobQuestionsDrawer
        isOpen={isJobDrawerOpen}
        onClose={() => setIsJobDrawerOpen(false)}
        jobResult={selectedJobResult}
        onStatusUpdate={() => {
          // Refresh jobs list to get updated applied status
          fetchMatches(currentMinScore);
        }}
      />
    </>
  );
};

export default Dashboard;
