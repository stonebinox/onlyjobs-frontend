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
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

import { BriefEntry } from "@/components/Today/BriefEntry";
import { REASON_LABELS, VisitedList } from "@/components/Today/VisitedList";
import { ResumeRequiredBanner } from "@/components/Dashboard/ResumeRequiredBanner";
import { JobChatSection } from "@/components/Dashboard/JobChatSection";
import { JobQuestionsDrawer } from "@/components/Dashboard/JobQuestionsDrawer";
import { LocationPromptBanner } from "@/components/Dashboard/LocationPromptBanner";
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

const BRIEF_SIZE = 5;

const TodayPage = () => {
  const [allFiltered, setAllFiltered] = useState<JobResult[]>([]);
  const [visibleCount, setVisibleCount] = useState(BRIEF_SIZE);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [outOfCreditPreview, setOutOfCreditPreview] = useState<OutOfCreditPreviewResponse | null>(null);
  const [skippedJobs, setSkippedJobs] = useState<JobResult[]>([]);
  const [skippedLoading, setSkippedLoading] = useState(false);
  const [skippedError, setSkippedError] = useState<string | null>(null);
  const [visitedJobs, setVisitedJobs] = useState<JobResult[]>([]);
  const [visitedLoading, setVisitedLoading] = useState(false);
  const [visitedError, setVisitedError] = useState<string | null>(null);
  const [cvUploading, setCvUploading] = useState(false);

  // Always tracks the latest allFiltered for use inside toast callbacks
  const allFilteredRef = useRef<JobResult[]>([]);
  // matchIds whose click was recorded; survives the entry being skipped (removed from state)
  const clickedIdsRef = useRef<Set<string>>(new Set());
  const cvFileInputRef = useRef<HTMLInputElement>(null);

  const {
    selectedJobResult: applyDrawerJob,
    isDrawerOpen: isApplyDrawerOpen,
    registerPending,
    openDrawer: openApplyDrawer,
    closeDrawer: closeApplyDrawer,
  } = useApplyReturnPrompt();

  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const view = searchParams.get("view");

  const {
    getMatches,
    checkWalletBalance,
    getUserProfile,
    getOutOfCreditPreview,
    unskipMatch,
    getSkipped,
    getVisited,
    updateUserProfile,
    uploadCV,
  } = createApiClient();

  const ALLOWED_CV_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const ALLOWED_CV_EXTENSIONS = [".pdf", ".docx"];

  const handleCVFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    if (cvUploading) return;
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!ALLOWED_CV_TYPES.includes(file.type) && !ALLOWED_CV_EXTENSIONS.includes(ext)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF or DOCX file.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setCvUploading(true);
    try {
      const result = await uploadCV(file);
      if (result && "error" in result) {
        toast({
          title: "Upload failed",
          description: String((result as { error: unknown }).error),
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        return;
      }
      const updated = await getUserProfile();
      if (updated && !("error" in updated)) {
        setUser(updated as User);
      }
      toast({
        title: "CV uploaded",
        description: "Your CV has been updated.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: "Upload failed",
        description: "Something went wrong. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setCvUploading(false);
    }
  };

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

    if (view === "skipped" || view === "visited") {
      // Subview data is loaded by the other effects
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
        setVisibleCount(BRIEF_SIZE);
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

  // Load visited subview data — only when that view is active, never in the brief's init
  useEffect(() => {
    if (!auth?.isReady || !auth?.isLoggedIn || view !== "visited") return;

    setVisitedLoading(true);
    setVisitedError(null);
    getVisited()
      .then((result: any) => {
        if (!result || "error" in result) {
          setVisitedError("Failed to load opened jobs");
        } else {
          setVisitedJobs(result as JobResult[]);
        }
      })
      .catch(() => setVisitedError("Failed to load opened jobs"))
      .finally(() => setVisitedLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.isReady, auth?.isLoggedIn, view]);

  const handleSaveLocation = async (location: string): Promise<boolean> => {
    const result = await updateUserProfile(undefined, undefined, undefined, undefined, location || null);
    if (result && "error" in result) {
      return false;
    }
    const updated = await getUserProfile();
    if (updated && !("error" in updated)) {
      setUser(updated as User);
    }
    return true;
  };

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

  // Single removal path: backfill is automatic because the visible list is a slice.
  const removeMatch = useCallback((matchId: string) => {
    setAllFiltered((prev) => prev.filter((e) => e._id !== matchId));
  }, []);

  const handleClickRecorded = useCallback((matchId: string) => {
    clickedIdsRef.current.add(matchId);
    setAllFiltered((prev) =>
      prev.map((e) => (e._id === matchId ? { ...e, clicked: true } : e))
    );
  }, []);

  const showAppliedToast = () => {
    toast({
      duration: 5000,
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
            Marked applied.
          </Text>
          <NextLink href="/tracker" onClick={onClose}>
            <Text as="span" fontSize="sm" color="primary.600" fontWeight="medium">
              View in tracker
            </Text>
          </NextLink>
        </Box>
      ),
    });
  };

  const handleApplyAnswer = (matchId: string, applied: boolean) => {
    if (view === "visited") {
      setVisitedJobs((prev) => prev.filter((j) => j._id !== matchId));
    } else {
      removeMatch(matchId);
    }
    if (applied) showAppliedToast();
  };

  const handleVisitedApplied = (matchId: string) => {
    setVisitedJobs((prev) => prev.filter((j) => j._id !== matchId));
    showAppliedToast();
  };

  const handleVisitedSkipped = (matchId: string) => {
    setVisitedJobs((prev) => prev.filter((j) => j._id !== matchId));
  };

  const handleSkipped = (matchId: string) => {
    // Stash the entry before removing (latest state, including a local clicked flag)
    const entry = allFilteredRef.current.find((e) => e._id === matchId);

    removeMatch(matchId);

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
              // Not eligible: missing job or already clicked (checked now, not at skip time)
              if (!entry.job || entry.clicked || clickedIdsRef.current.has(entry._id)) {
                onClose();
                return;
              }
              const restored = { ...entry, skipped: false };
              const updated = [...allFilteredRef.current, restored].sort(
                (a, b) => b.matchScore - a.matchScore
              );
              setAllFiltered(updated);
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

  const displayJobs = allFiltered.slice(0, visibleCount);

  // Headline stays the brief count, not the expanded list length
  const briefCount = Math.min(displayJobs.length, BRIEF_SIZE);
  const countLabel = COUNT_WORDS[briefCount] ?? String(briefCount);

  const moreCount = allFiltered.length - displayJobs.length;
  const nextBatch = Math.min(BRIEF_SIZE, moreCount);
  const showMoreLabel =
    nextBatch === moreCount
      ? `Show ${nextBatch} more`
      : `Show ${nextBatch} more (${moreCount} remaining)`;

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

  // ── Visited (opened) subview ───────────────────────────────────────────────
  if (view === "visited") {
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
          title="Opened Jobs | OnlyJobs"
          description="Jobs you have opened"
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
                  Opened jobs
                </Heading>
              </Box>
              <VisitedList
                rows={visitedJobs}
                loading={visitedLoading}
                error={visitedError}
                onOpenDrawer={openApplyDrawer}
                onApplied={handleVisitedApplied}
                onSkipped={handleVisitedSkipped}
              />
            </VStack>
          </Box>
        </DashboardLayout>
        <JobQuestionsDrawer
          isOpen={isApplyDrawerOpen}
          onClose={closeApplyDrawer}
          jobResult={applyDrawerJob}
          onStatusUpdate={handleApplyAnswer}
        />
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
          <input
            ref={cvFileInputRef}
            type="file"
            accept=".pdf,.docx"
            style={{ display: "none" }}
            onChange={handleCVFileSelect}
          />
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

              {/* No-resume banner - shown whenever profile has no CV, regardless of match count */}
              {hasNoMeaningfulResume(user) && (
                <ResumeRequiredBanner
                  onUploadClick={() => cvFileInputRef.current?.click()}
                  isUploading={cvUploading}
                />
              )}

              {/* Location prompt — shown when user has no currentLocation */}
              {!loading && user && !user.currentLocation && (
                <LocationPromptBanner
                  onSave={handleSaveLocation}
                />
              )}

              {/* Entries */}
              {displayJobs.length > 0 ? (
                <>
                  <AnimatePresence initial={false}>
                    {displayJobs.map((entry) => (
                      <motion.div
                        key={entry._id}
                        layout={!reduceMotion}
                        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={
                          reduceMotion
                            ? { opacity: 0, transition: { duration: 0 } }
                            : { opacity: 0, x: -24, transition: { duration: 0.2 } }
                        }
                        style={{ width: "100%" }}
                      >
                        <BriefEntry
                          entry={entry}
                          onSkipped={handleSkipped}
                          onOpenListing={registerPending}
                          onClickRecorded={handleClickRecorded}
                          aiSection={<JobChatSection matchId={entry._id} />}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Footer */}
                  <Box pt={2}>
                    {moreCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        mb={3}
                        onClick={() => setVisibleCount((c) => c + BRIEF_SIZE)}
                      >
                        {showMoreLabel}
                      </Button>
                    )}
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
                    <NextLink href="/today?view=visited">
                      <Text
                        as="span"
                        color="text.tertiary"
                        fontSize="sm"
                        cursor="pointer"
                        _hover={{ textDecoration: "underline" }}
                        mt={1}
                        display="block"
                      >
                        See opened jobs →
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
                    <NextLink href="/today?view=visited">
                      <Text
                        as="span"
                        color="text.tertiary"
                        fontSize="sm"
                        cursor="pointer"
                        _hover={{ textDecoration: "underline" }}
                        mt={1}
                        display="block"
                      >
                        See opened jobs →
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
        onStatusUpdate={handleApplyAnswer}
      />
    </>
  );
};

export default TodayPage;
