import {
  Box,
  Center,
  Heading,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AllJobsTab } from "@/components/AllJobsTab";
import { JobQuestionsDrawer } from "@/components/Dashboard/JobQuestionsDrawer";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { createApiClient } from "@/lib/apiClient";
import { JobResult } from "@/types/JobResult";
import { User } from "@/types/User";

const BrowsePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJobDrawerOpen, setIsJobDrawerOpen] = useState(false);
  const [selectedJobResult, setSelectedJobResult] = useState<JobResult | null>(null);
  const [pendingJobForDrawer, setPendingJobForDrawer] = useState<JobResult | null>(null);

  const auth = useAuth();
  const router = useRouter();
  const { getUserProfile, checkWalletBalance } = createApiClient();

  useEffect(() => {
    if (!auth?.isReady) return;

    if (!auth?.isLoggedIn) {
      const returnTo = window.location.pathname + window.location.search;
      sessionStorage.setItem("onlyjobs_returnTo", returnTo);
      router.push(`/?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    const init = async () => {
      setLoading(true);
      try {
        const [userData, walletResult] = await Promise.all([
          getUserProfile(),
          checkWalletBalance(),
        ]);

        if (userData && !("error" in userData)) {
          setUser(userData as User);
        }

        if (walletResult && !("error" in walletResult)) {
          setWalletBalance(walletResult.balance);
        }
      } catch (err) {
        console.error("Error loading browse page:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.isReady, auth?.isLoggedIn]);

  const openJobQuestionsDrawer = (jobResult: JobResult) => {
    setSelectedJobResult(jobResult);
    setIsJobDrawerOpen(true);
    if (pendingJobForDrawer?._id === jobResult._id) {
      setPendingJobForDrawer(null);
    }
  };

  const handleApplyClick = (jobResult: JobResult) => {
    setPendingJobForDrawer(jobResult);
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && pendingJobForDrawer) {
        if (!isJobDrawerOpen) {
          setSelectedJobResult(pendingJobForDrawer);
          setIsJobDrawerOpen(true);
          setPendingJobForDrawer(null);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pendingJobForDrawer, isJobDrawerOpen]);

  return (
    <>
      <SEO title="Browse | OnlyJobs" description="Browse job listings" noindex />
      <DashboardLayout>
        <Box maxW="1200px" mx="auto" py={{ base: 4, md: 8 }} px={{ base: 2, md: 4 }}>
          {loading ? (
            <Center py={20}>
              <Spinner size="lg" color="primary.400" />
            </Center>
          ) : (
            <VStack align="start" spacing={6} width="100%">
              <Box>
                <Heading as="h1" size="lg" fontFamily="heading" color="text.primary" mb={2}>
                  Browse
                </Heading>
                <Text color="text.secondary" fontSize="sm">
                  Real listings, no charge. Browsing and applying are always free — the only paid
                  action is{" "}
                  <Text as="span" fontWeight="medium">
                    Score this for me
                  </Text>{" "}
                  ($0.05) if you want on-demand AI analysis on a specific job.
                </Text>
              </Box>

              {!user?.isVerified ? (
                <Box
                  p={6}
                  borderRadius="2xl"
                  border="1px dashed"
                  borderColor="surface.border"
                  bg="surface.card"
                  width="100%"
                >
                  <Text color="text.secondary" mb={3}>
                    Verify your email to browse jobs.
                  </Text>
                  <NextLink href="/settings">
                    <Text
                      as="span"
                      color="primary.600"
                      fontWeight="medium"
                      fontSize="sm"
                      cursor="pointer"
                      _hover={{ textDecoration: "underline" }}
                    >
                      Go to settings to resend verification →
                    </Text>
                  </NextLink>
                </Box>
              ) : (
                <AllJobsTab
                  user={user}
                  walletBalance={walletBalance}
                  openJobQuestionsDrawer={openJobQuestionsDrawer}
                  onApplyClick={handleApplyClick}
                  onBalanceChange={setWalletBalance}
                />
              )}
            </VStack>
          )}
        </Box>
      </DashboardLayout>
      <JobQuestionsDrawer
        isOpen={isJobDrawerOpen}
        onClose={() => setIsJobDrawerOpen(false)}
        jobResult={selectedJobResult}
      />
    </>
  );
};

export default BrowsePage;
