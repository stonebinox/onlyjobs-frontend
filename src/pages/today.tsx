import {
  Box,
  Button,
  Center,
  Heading,
  Spinner,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BriefEntry } from "@/components/Today/BriefEntry";
import { JobQuestionsDrawer } from "@/components/Dashboard/JobQuestionsDrawer";
import { OutOfCreditPreview } from "@/components/Dashboard/OutOfCreditPreview";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { createApiClient, OutOfCreditPreviewResponse } from "@/lib/apiClient";
import { useApplyReturnPrompt } from "@/hooks/useApplyReturnPrompt";
import { JobResult } from "@/types/JobResult";
import { User } from "@/types/User";
import { isSafeUrl } from "@/utils/brief-utils";
import { resolveMinScore, filterMatches } from "@/utils/today-selection";
import { hasMeaningfulResume } from "@/utils/resumePredicate";

const hasNoMeaningfulResume = (u: User | null): boolean =>
  !hasMeaningfulResume(u?.resume);

const COUNT_WORDS: Record<number, string> = {
  1: "One",
  2: "Two",
  3: "Three",
  4: "Four",
  5: "Five",
};

const formatHeaderDate = (): string => {
  const today = new Date();
  const dayName = today.toLocaleDateString("en-GB", { weekday: "long" });
  const day = today.getDate();
  const month = today.toLocaleDateString("en-GB", { month: "long" });
  return `${dayName}, ${day} ${month}`;
};

const REASON_LABELS: Record<string, string> = {
  salary: "Salary too low",
  location: "Location/remote policy",
  skills_gap: "Missing required skills",
  company_type: "Company size/stage",
  role_mismatch: "Role doesn't match goals",
  job_inactive: "Job no longer available",
  other: "Other",
};

const TodayPage = () => {
  const [allFiltered, setAllFiltered] = useState<JobResult[]>([]);
  const [displayJobs, setDisplayJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [outOfCreditPreview, setOutOfCreditPreview] = useState<OutOfCreditPreviewResponse | null>(null);
  const [skippedJobs, setSkippedJobs] = useState<JobResult[]>([]);
  const [skippedLoading, setSkippedLoading] = useState(false);
  const [skippedError, setSkippedError] = useState<string | null>(null);

  // Always tracks the latest allFiltered for use inside toast callbacks
  const allFilteredRef = useRef<JobResult[]>([]);

  const {
    selectedJobResult: applyDrawerJob,
    isDrawerOpen: isApplyDrawerOpen,
    registerPending,
    closeDrawer: closeApplyDrawer,
  } = useApplyReturnPrompt();

  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const view = searchParams.get("view");

  const {
    getMatches,
    checkWalletBalance,
    getUserProfile,
    getOutOfCreditPreview,
    unskipMatch,
    getSkipped,
  } = createApiClient();

  // Keep ref in sync with allFiltered so toast undo callbacks always see current state
  useEffect(() => {
    allFilteredRef.current = allFiltered;
  }, [allFiltered]);

  useEffect(() => {
    if (!auth?.isReady) return;

    if (!auth?.isLoggedIn) {
      const returnTo = window.location.pathname + window.location.search;
      sessionStorage.setItem("onlyjobs_returnTo", returnTo);
      router.push(`/?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    if (view === "skipped") {
      // Skipped subview data is loaded by the other effect
      setLoading(false);
      return;
    }

    const init = async () => {
      setLoading(true);
      try {
        const [userData, walletResult, previewResult] = await Promise.all([
          getUserProfile(),
          checkWalletBalance(),
          getOutOfCreditPreview(),
        ]);

        let resolvedUser: User | null = null;
        if (userData && !("error" in userData)) {
          resolvedUser = userData as User;
          setUser(resolvedUser);
        }

        if (walletResult && !("error" in walletResult)) {
          setWalletBalance(walletResult.balance);
        }

        if (previewResult && !("error" in previewResult)) {
          setOutOfCreditPreview(previewResult as OutOfCreditPreviewResponse);
        }

        const minScore = resolveMinScore(resolvedUser?.preferences?.minScore);
        const response = await getMatches(minScore);

        if (!response || "error" in response) return;

        // Filter before cap — never the other way around
        const filtered = filterMatches(response as JobResult[]);
        setAllFiltered(filtered);
        setDisplayJobs(filtered.slice(0, 5));
      } catch (err) {
        console.error("Error loading today page:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.isReady, auth?.isLoggedIn, view]);

  // Load skipped subview data
  useEffect(() => {
    if (!auth?.isReady || !auth?.isLoggedIn || view !== "skipped") return;

    setSkippedLoading(true);
    setSkippedError(null);
    getSkipped()
      .then((result: any) => {
        if (!result || "error" in result) {
          setSkippedError("Failed to load skipped jobs");
        } else {
          setSkippedJobs(result as JobResult[]);
        }
      })
      .catch(() => setSkippedError("Failed to load skipped jobs"))
      .finally(() => setSkippedLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.isReady, auth?.isLoggedIn, view]);

  const handleUnskipFromSkippedView = async (matchId: string) => {
    const result = await unskipMatch(matchId);
    if (result && "error" in result) {
      toast({
        title: "Unskip failed",
        description: "Could not unskip this job. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setSkippedJobs((prev) => prev.filter((j) => j._id !== matchId));
  };

  const handleSkipped = (matchId: string) => {
    // Stash the entry before removing (always in displayJobs since BriefEntry only renders displayJobs)
    const entry = displayJobs.find((e) => e._id === matchId);

    setDisplayJobs((prev) => prev.filter((e) => e._id !== matchId));
    setAllFiltered((prev) => prev.filter((e) => e._id !== matchId));

    if (!entry) return;

    toast({
      duration: 6000,
      isClosable: true,
      render: ({ onClose }) => (
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          p={3}
          display="flex"
          alignItems="center"
          gap={3}
          shadow="md"
        >
          <Text fontSize="sm" flex={1} color="gray.600">
            Job skipped.
          </Text>
          <Button
            size="sm"
            variant="ghost"
            colorScheme="blue"
            onClick={async () => {
              const result = await unskipMatch(entry._id);
              if (result && "error" in result) {
                toast({
                  title: "Undo failed",
                  status: "error",
                  duration: 3000,
                  isClosable: true,
                });
                onClose();
                return;
              }
              // Not eligible: missing job or already clicked
              if (!entry.job || entry.clicked) {
                onClose();
                return;
              }
              const restored = { ...entry, skipped: false };
              const updated = [...allFilteredRef.current, restored].sort(
                (a, b) => b.matchScore - a.matchScore
              );
              setAllFiltered(updated);
              setDisplayJobs(updated.slice(0, 5));
              onClose();
            }}
          >
            Undo
          </Button>
        </Box>
      ),
    });
  };

  // Compute days from cents — never float-divide dollars
  const walletDays =
    walletBalance !== null
      ? Math.floor(Math.round(walletBalance * 100) / 30)
      : null;
  const showWalletWarning = walletDays !== null && walletDays < 10;

  const countLabel =
    COUNT_WORDS[displayJobs.length] ?? String(displayJobs.length);

  // Jobs beyond the displayed five
  const moreCount = allFiltered.length - displayJobs.length;

  const headerDate = formatHeaderDate();

  // ── Skipped subview ────────────────────────────────────────────────────────
  if (view === "skipped") {
    if (!auth?.isReady || !auth?.isLoggedIn) {
      return (
        <Center minH="100vh">
          <Spinner size="xl" />
        </Center>
      );
    }

    return (
      <>
        <SEO
          title="Skipped Jobs | OnlyJobs"
          description="Jobs you have skipped"
          noindex
        />
        <DashboardLayout>
          <Box maxW="680px" mx="auto" py={{ base: 4, md: 8 }} px={{ base: 2, md: 0 }}>
            <VStack align="start" spacing={6}>
              <Box>
                <NextLink href="/today">
                  <Text
                    as="span"
                    color="primary.600"
                    fontWeight="medium"
                    fontSize="sm"
                    cursor="pointer"
                    _hover={{ textDecoration: "underline" }}
                  >
                    ← Back to today
                  </Text>
                </NextLink>
                <Heading
                  as="h1"
                  size="lg"
                  fontFamily="heading"
                  color="text.primary"
                  mt={3}
                >
                  Skipped jobs
                </Heading>
              </Box>

              {skippedLoading ? (
                <Center py={20} w="100%">
                  <Spinner size="lg" color="primary.400" />
                </Center>
              ) : skippedError ? (
                <Text color="red.500">{skippedError}</Text>
              ) : skippedJobs.length === 0 ? (
                <Box
                  p={6}
                  borderRadius="2xl"
                  border="1px dashed"
                  borderColor="surface.border"
                  bg="surface.card"
                  width="100%"
                >
                  <Text color="text.secondary">Nothing skipped</Text>
                </Box>
              ) : (
                skippedJobs.map((entry) => (
                  <Box
                    key={entry._id}
                    p={4}
                    borderRadius="2xl"
                    border="1px solid"
                    borderColor="surface.border"
                    bg="surface.card"
                    width="100%"
                  >
                    <Text fontWeight="semibold" color="text.primary">
                      {entry.job?.title ?? "Unknown role"}
                    </Text>
                    <Text fontSize="sm" color="text.secondary" mb={2}>
                      {entry.job?.company ?? "Unknown company"}
                    </Text>
                    {entry.skipReason?.category && (
                      <Text fontSize="sm" color="text.tertiary" mb={3}>
                        Skipped:{" "}
                        {REASON_LABELS[entry.skipReason.category] ??
                          entry.skipReason.category}
                      </Text>
                    )}
                    <Box display="flex" gap={2} flexWrap="wrap">
                      {entry.job?.url && isSafeUrl(entry.job.url) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            window.open(entry.job!.url, "_blank", "noopener,noreferrer");
                          }}
                        >
                          View job
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        onClick={() => handleUnskipFromSkippedView(entry._id)}
                      >
                        Unskip
                      </Button>
                    </Box>
                  </Box>
                ))
              )}
            </VStack>
          </Box>
        </DashboardLayout>
      </>
    );
  }

  // ── Daily brief ────────────────────────────────────────────────────────────
  return (
    <>
      <SEO
        title="Today | OnlyJobs"
        description="Your daily job brief"
        noindex
      />
      <DashboardLayout>
        <Box maxW="680px" mx="auto" py={{ base: 4, md: 8 }} px={{ base: 2, md: 0 }}>
          {loading ? (
            <Center py={20}>
              <Spinner size="lg" color="primary.400" />
            </Center>
          ) : (
            <VStack align="start" spacing={{ base: 6, md: 8 }}>
              <OutOfCreditPreview preview={outOfCreditPreview} />

              {/* Header */}
              <Box>
                <Text fontSize="sm" color="text.tertiary" mb={1}>
                  {headerDate}
                </Text>
                <Heading
                  as="h1"
                  size="lg"
                  fontFamily="heading"
                  color="text.primary"
                >
                  {displayJobs.length > 0
                    ? `${countLabel} worth your time.`
                    : "Nothing new today."}
                </Heading>
                {showWalletWarning && walletBalance !== null && (
                  <Text fontSize="sm" color="text.tertiary" mt={1}>
                    ${walletBalance.toFixed(2)} left · about{" "}
                    {walletDays} {walletDays === 1 ? "day" : "days"}
                  </Text>
                )}
              </Box>

              {/* Entries */}
              {displayJobs.length > 0 ? (
                <>
                  {displayJobs.map((entry) => (
                    <BriefEntry
                      key={entry._id}
                      entry={entry}
                      onSkipped={handleSkipped}
                      onOpenListing={registerPending}
                    />
                  ))}

                  {/* Footer */}
                  <Box pt={2}>
                    <Text color="text.secondary">
                      {"That's today."}
                      {moreCount > 0 && (
                        <>
                          {" "}
                          {moreCount === 1
                            ? "One more scored lower."
                            : `${moreCount} more scored lower.`}
                        </>
                      )}
                    </Text>
                    <NextLink href="/today?view=skipped">
                      <Text
                        as="span"
                        color="text.tertiary"
                        fontSize="sm"
                        cursor="pointer"
                        _hover={{ textDecoration: "underline" }}
                        mt={1}
                        display="block"
                      >
                        See skipped jobs →
                      </Text>
                    </NextLink>
                  </Box>
                </>
              ) : (
                /* Empty state — actionable, not a cron schedule */
                <>
                  <Box
                    p={6}
                    borderRadius="2xl"
                    border="1px dashed"
                    borderColor="surface.border"
                    bg="surface.card"
                    width="100%"
                  >
                    <Text color="text.secondary" mb={3}>
                      No new matches right now. Make sure your CV and Q&amp;A are
                      up to date — the better your profile, the more the system
                      has to work with.
                    </Text>
                    {hasNoMeaningfulResume(user) && (
                      <NextLink href="/profile">
                        <Text
                          as="span"
                          color="primary.600"
                          fontWeight="medium"
                          fontSize="sm"
                          cursor="pointer"
                          _hover={{ textDecoration: "underline" }}
                          display="block"
                          mb={2}
                        >
                          Add your CV →
                        </Text>
                      </NextLink>
                    )}
                    <NextLink href="/browse">
                      <Text
                        as="span"
                        color="primary.600"
                        fontWeight="medium"
                        fontSize="sm"
                        cursor="pointer"
                        _hover={{ textDecoration: "underline" }}
                      >
                        Browse all jobs →
                      </Text>
                    </NextLink>
                  </Box>
                  <Box>
                    <NextLink href="/today?view=skipped">
                      <Text
                        as="span"
                        color="text.tertiary"
                        fontSize="sm"
                        cursor="pointer"
                        _hover={{ textDecoration: "underline" }}
                      >
                        See skipped jobs →
                      </Text>
                    </NextLink>
                  </Box>
                </>
              )}
            </VStack>
          )}
        </Box>
      </DashboardLayout>
      <JobQuestionsDrawer
        isOpen={isApplyDrawerOpen}
        onClose={closeApplyDrawer}
        jobResult={applyDrawerJob}
      />
    </>
  );
};

export default TodayPage;
