import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Heading,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import DashboardLayout from "@/components/Layout/DashboardLayout";
import { SEO } from "@/components/SEO";
import {
  FollowUpWizardModal,
  OUTCOME_OPTIONS,
  OutcomeKey,
} from "@/components/Dashboard/FollowUpWizardModal";
import { TrackerDetailDrawer } from "@/components/Dashboard/TrackerDetailDrawer";
import { JobChatSection } from "@/components/Dashboard/JobChatSection";
import { useAuth } from "@/contexts/AuthContext";
import { createApiClient } from "@/lib/apiClient";
import { JobResult } from "@/types/JobResult";
import { isSafeUrl } from "@/utils/brief-utils";
import { LOOK } from "@/theme/palette";
import {
  getQuietDays,
  getTrackerColumn,
  shouldShowFollowUp,
  TrackerColumn,
} from "@/utils/tracker-utils";

const COLUMNS: { key: TrackerColumn; label: string }[] = [
  { key: "applied", label: "Applied" },
  { key: "heard_back", label: "Heard back" },
  { key: "interviewing", label: "Interviewing" },
  { key: "closed", label: "Closed" },
];

const MOVE_OPTIONS: { label: string; outcome: OutcomeKey }[] = [
  { label: "Heard back",           outcome: "heard_back"  },
  { label: "Interviewing",         outcome: "interview"   },
  { label: "Closed · Got offer",   outcome: "offer"       },
  { label: "Closed · Rejected",    outcome: "rejected"    },
  { label: "Closed · No response", outcome: "no_response" },
];

const formatAppliedDate = (appliedAt: string | undefined): string | null => {
  if (!appliedAt) return null;
  const d = new Date(appliedAt);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

interface TrackerCardProps {
  job: JobResult;
  onSetOutcome: (matchId: string, outcome: OutcomeKey) => Promise<string | null>;
  onUpdateStatus?: () => void;
  onOpenDetails: (job: JobResult) => void;
}

const OutcomeBadge = ({ outcome }: { outcome: string }) => {
  if (outcome === "offer") {
    return (
      <Badge colorScheme="green" fontSize="xs" px={2} py={0.5}>
        Got Offer 🎉
      </Badge>
    );
  }
  const opt = OUTCOME_OPTIONS[outcome as OutcomeKey];
  if (!opt) return null;
  return (
    <Badge colorScheme={opt.color} fontSize="xs" px={2} py={0.5}>
      {opt.label}
    </Badge>
  );
};

const TrackerCard = ({ job, onSetOutcome, onUpdateStatus, onOpenDetails }: TrackerCardProps) => {
  const [submitting, setSubmitting] = useState<OutcomeKey | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleOutcome = async (outcome: OutcomeKey) => {
    setSubmitting(outcome);
    setCardError(null);
    try {
      const err = await onSetOutcome(job._id, outcome);
      if (err) setCardError(err);
    } catch {
      setCardError("Could not update status. Please try again.");
    } finally {
      setSubmitting(null);
    }
  };

  const quietDays = getQuietDays(job.appliedAt);
  const showFollowUp = shouldShowFollowUp(job);
  const appliedDate = formatAppliedDate(job.appliedAt);
  const jobUrl = job.job?.url;
  const title = job.job?.title ?? "Listing no longer available";
  const company = job.job?.company;

  return (
    <Box
      bg="surface.card"
      border="1px solid"
      borderColor="surface.border"
      borderRadius="xl"
      p={4}
      width="100%"
      onClick={() => onOpenDetails(job)}
      cursor="pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          if (e.key === " ") e.preventDefault();
          onOpenDetails(job);
        }
      }}
    >
      <VStack align="start" spacing={2}>
        {/* Title + company */}
        {jobUrl && isSafeUrl(jobUrl) ? (
          <Link
            href={jobUrl}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(jobUrl, "_blank", "noopener,noreferrer");
            }}
            fontWeight="semibold"
            fontSize="sm"
            color="text.primary"
            _hover={{ textDecoration: "underline" }}
          >
            {title}
          </Link>
        ) : (
          <Text fontWeight="semibold" fontSize="sm" color={job.job ? "text.primary" : "text.tertiary"}>
            {title}
          </Text>
        )}
        {company && (
          <Text fontSize="xs" color="text.secondary">
            {company}
          </Text>
        )}

        {/* Applied date */}
        {appliedDate && (
          <Text fontSize="xs" color="text.tertiary">
            Applied {appliedDate}
          </Text>
        )}

        {/* Current status */}
        <HStack spacing={1}>
          <Text fontSize="xs" color="text.secondary">Status:</Text>
          {job.applicationOutcome ? (
            <OutcomeBadge outcome={job.applicationOutcome} />
          ) : (
            <Badge colorScheme="gray" fontSize="xs" px={2} py={0.5}>Applied</Badge>
          )}
        </HStack>

        {/* Follow-up nudge + Update status action */}
        {showFollowUp && quietDays !== null && (
          <>
            <Text fontSize="xs" color={LOOK}>
              {quietDays} days quiet — follow up?
            </Text>
            {onUpdateStatus && (
              <Button
                size={{ base: "md", sm: "sm" }}
                variant="outline"
                colorScheme="orange"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus();
                }}
              >
                Update status
              </Button>
            )}
          </>
        )}

        {/* Card error */}
        {cardError && (
          <Alert status="error" borderRadius="md" py={1} px={2}>
            <AlertIcon boxSize={3} mr={1} />
            <Text fontSize="xs">{cardError}</Text>
          </Alert>
        )}

        {/* Move to menu */}
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<FiChevronDown />}
            size={{ base: "md", sm: "sm" }}
            w={{ base: "100%", sm: "auto" }}
            variant="outline"
            isLoading={submitting !== null}
            isDisabled={submitting !== null}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            Move to
          </MenuButton>
          <MenuList>
            {MOVE_OPTIONS.map(({ label, outcome }) => (
              <MenuItem
                key={outcome}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOutcome(outcome);
                }}
                isDisabled={job.applicationOutcome === outcome || submitting !== null}
                icon={job.applicationOutcome === outcome ? <FiCheck /> : undefined}
              >
                {label}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </VStack>
    </Box>
  );
};

const TrackerPage = () => {
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Detail drawer state
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Wizard state
  const [wizardJobs, setWizardJobs] = useState<JobResult[]>([]);
  const [wizardIndex, setWizardIndex] = useState(0);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardSubmitting, setWizardSubmitting] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);
  // Guards against the effect re-opening the wizard after param is stripped
  const followupTriggered = useRef(false);

  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { getTracker, recordApplicationOutcome } = createApiClient();

  const handleSetOutcome = async (matchId: string, outcome: OutcomeKey): Promise<string | null> => {
    const result = await recordApplicationOutcome(matchId, outcome);
    if (result && "error" in result) {
      return result.error as string;
    }
    // Optimistic local update only after confirmed API success
    setJobs((prev) =>
      prev.map((j) =>
        j._id === matchId ? { ...j, applicationOutcome: outcome } : j
      )
    );
    return null;
  };

  const openWizardForJobs = (eligible: JobResult[]) => {
    setWizardJobs(eligible);
    setWizardIndex(0);
    setWizardError(null);
    setIsWizardOpen(true);
  };

  const refreshTracker = async () => {
    setLoading(true);
    try {
      const result = await getTracker();
      if (result && "error" in result) {
        setPageError(result.error as string);
      } else {
        setJobs(Array.isArray(result) ? result : []);
      }
    } catch {
      setPageError("Failed to load your tracker. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const advanceWizard = (currentIndex: number, total: number) => {
    setWizardError(null);
    if (currentIndex + 1 >= total) {
      setIsWizardOpen(false);
      refreshTracker();
    } else {
      setWizardIndex(currentIndex + 1);
    }
  };

  const handleWizardSelectOutcome = async (outcome: OutcomeKey) => {
    const currentTrackerJob = wizardJobs[wizardIndex];
    if (!currentTrackerJob) return;
    setWizardSubmitting(true);
    setWizardError(null);
    try {
      const err = await handleSetOutcome(currentTrackerJob._id, outcome);
      if (err) {
        setWizardError(err);
      } else {
        advanceWizard(wizardIndex, wizardJobs.length);
      }
    } finally {
      setWizardSubmitting(false);
    }
  };

  const handleWizardSkip = () => {
    advanceWizard(wizardIndex, wizardJobs.length);
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
  };

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
        const result = await getTracker();
        if (result && "error" in result) {
          setPageError(result.error as string);
          return;
        }
        setJobs(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error("Error loading tracker:", err);
        setPageError("Failed to load your tracker. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.isReady, auth?.isLoggedIn]);

  // Open wizard when ?followup=true is present, after jobs are loaded successfully.
  // followupTriggered ref prevents re-opening if jobs state changes afterward.
  // Guard on pageError: do not consume the param when the load failed — preserve it
  // so a later successful load or manual reload can still honor it.
  useEffect(() => {
    if (loading || pageError || !auth?.isLoggedIn) return;
    if (followupTriggered.current) return;
    if (searchParams?.get("followup") !== "true") return;

    followupTriggered.current = true;
    router.replace("/tracker");

    let eligible = jobs.filter(shouldShowFollowUp);
    if (eligible.length === 0) {
      // Fallback: any applied job without an outcome
      eligible = jobs.filter((j) => !j.applicationOutcome);
    }
    if (eligible.length === 0) {
      toast({ title: "You're all caught up!", status: "info", duration: 4000, isClosable: true });
      return;
    }
    openWizardForJobs(eligible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, pageError, auth?.isLoggedIn, jobs]);

  const grouped: Record<TrackerColumn, JobResult[]> = {
    applied: [],
    heard_back: [],
    interviewing: [],
    closed: [],
  };
  for (const job of jobs) {
    grouped[getTrackerColumn(job)].push(job);
  }

  const currentWizardJob = wizardJobs[wizardIndex] ?? null;
  const detailJob = selectedJobId ? (jobs.find(j => j._id === selectedJobId) ?? null) : null;

  return (
    <>
      <SEO title="Tracker | OnlyJobs" description="Your application tracker" noindex />
      <DashboardLayout>
        <Box maxW="1200px" mx="auto" py={{ base: 4, md: 8 }} px={{ base: 2, md: 4 }}>
          {loading ? (
            <Center py={20}>
              <Spinner size="lg" color="primary.400" />
            </Center>
          ) : (
            <VStack align="start" spacing={6} width="100%">
              <Heading as="h1" size="lg" fontFamily="heading" color="text.primary">
                Tracker
              </Heading>

              {pageError && (
                <Alert status="error" borderRadius="lg">
                  <AlertIcon />
                  {pageError}
                </Alert>
              )}

              {jobs.length === 0 && !pageError ? (
                <Box
                  p={6}
                  borderRadius="2xl"
                  border="1px dashed"
                  borderColor="surface.border"
                  bg="surface.card"
                  width="100%"
                >
                  <Text color="text.secondary" mb={3}>
                    Nothing here yet — your applied jobs will appear once you start tracking applications.
                  </Text>
                  <Flex gap={4}>
                    <NextLink href="/today">
                      <Text
                        as="span"
                        color="primary.600"
                        fontWeight="medium"
                        fontSize="sm"
                        cursor="pointer"
                        _hover={{ textDecoration: "underline" }}
                      >
                        Go to today →
                      </Text>
                    </NextLink>
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
                  </Flex>
                </Box>
              ) : (
                <SimpleGrid
                  columns={{ base: 1, sm: 2, lg: 4 }}
                  spacing={4}
                  width="100%"
                  alignItems="start"
                >
                  {COLUMNS.map(({ key, label }) => (
                    <Box key={key}>
                      <Flex align="center" mb={3} gap={2}>
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color="text.secondary"
                          textTransform="uppercase"
                          letterSpacing="wide"
                        >
                          {label}
                        </Text>
                        <Badge
                          colorScheme="gray"
                          borderRadius="full"
                          fontSize="xs"
                        >
                          {grouped[key].length}
                        </Badge>
                      </Flex>
                      <VStack spacing={3} align="stretch">
                        {grouped[key].length === 0 ? (
                          <Box
                            p={3}
                            borderRadius="lg"
                            border="1px dashed"
                            borderColor="surface.border"
                          >
                            <Text fontSize="xs" color="text.tertiary" textAlign="center">
                              Empty
                            </Text>
                          </Box>
                        ) : (
                          grouped[key].map((job) => (
                            <TrackerCard
                              key={job._id}
                              job={job}
                              onSetOutcome={handleSetOutcome}
                              onUpdateStatus={
                                shouldShowFollowUp(job)
                                  ? () =>
                                      openWizardForJobs([
                                        job,
                                        ...jobs.filter(
                                          (j) => j._id !== job._id && shouldShowFollowUp(j)
                                        ),
                                      ])
                                  : undefined
                              }
                              onOpenDetails={(j) => {
                                setSelectedJobId(j._id);
                                setIsDetailOpen(true);
                              }}
                            />
                          ))
                        )}
                      </VStack>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </VStack>
          )}
        </Box>

        {/* Detail drawer — rendered once at page level; job is derived live from
            jobs state so outcome changes from card or drawer both sync. */}
        <TrackerDetailDrawer
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          job={detailJob}
          onSetOutcome={handleSetOutcome}
          aiSection={detailJob ? <JobChatSection matchId={detailJob._id} /> : null}
        />

        {/* Follow-up wizard — rendered outside the loading conditional so it can
            open while the board is visible. Modal portal renders at document body. */}
        <FollowUpWizardModal
          isOpen={isWizardOpen}
          currentJob={
            currentWizardJob
              ? {
                  matchId: currentWizardJob._id,
                  title: currentWizardJob.job?.title ?? "This listing",
                  company: currentWizardJob.job?.company ?? "this company",
                }
              : null
          }
          step={wizardIndex + 1}
          total={wizardJobs.length}
          isSubmitting={wizardSubmitting}
          error={wizardError}
          onSelectOutcome={handleWizardSelectOutcome}
          onSkip={handleWizardSkip}
          onClose={handleWizardClose}
        />
      </DashboardLayout>
    </>
  );
};

export default TrackerPage;
