import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Link,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import DashboardLayout from "@/components/Layout/DashboardLayout";
import { SEO } from "@/components/SEO";
import {
  OUTCOME_OPTIONS,
  OutcomeKey,
} from "@/components/Dashboard/FollowUpWizardModal";
import { useAuth } from "@/contexts/AuthContext";
import { createApiClient } from "@/lib/apiClient";
import { JobResult } from "@/types/JobResult";
import { isSafeUrl } from "@/utils/brief-utils";
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

const formatAppliedDate = (appliedAt: string | undefined): string | null => {
  if (!appliedAt) return null;
  const d = new Date(appliedAt);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

interface TrackerCardProps {
  job: JobResult;
  onSetOutcome: (matchId: string, outcome: OutcomeKey) => Promise<string | null>;
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

const TrackerCard = ({ job, onSetOutcome }: TrackerCardProps) => {
  const [submitting, setSubmitting] = useState<OutcomeKey | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleOutcome = async (outcome: OutcomeKey) => {
    setSubmitting(outcome);
    setCardError(null);
    const err = await onSetOutcome(job._id, outcome);
    if (err) setCardError(err);
    setSubmitting(null);
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
    >
      <VStack align="start" spacing={2}>
        {/* Title + company */}
        {jobUrl && isSafeUrl(jobUrl) ? (
          <Link
            href={jobUrl}
            onClick={(e) => {
              e.preventDefault();
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

        {/* Current outcome badge */}
        {job.applicationOutcome && (
          <OutcomeBadge outcome={job.applicationOutcome} />
        )}

        {/* Follow-up nudge */}
        {showFollowUp && quietDays !== null && (
          <Text fontSize="xs" color="orange.500">
            {quietDays} days quiet — follow up?
          </Text>
        )}

        {/* Card error */}
        {cardError && (
          <Alert status="error" borderRadius="md" py={1} px={2}>
            <AlertIcon boxSize={3} mr={1} />
            <Text fontSize="xs">{cardError}</Text>
          </Alert>
        )}

        {/* Outcome controls */}
        <Wrap spacing={1} pt={1}>
          {(Object.keys(OUTCOME_OPTIONS) as OutcomeKey[]).map((key) => (
            <WrapItem key={key}>
              <Button
                size="xs"
                variant="outline"
                colorScheme={OUTCOME_OPTIONS[key].color}
                onClick={() => handleOutcome(key)}
                isLoading={submitting === key}
                isDisabled={submitting !== null}
              >
                {OUTCOME_OPTIONS[key].label}
              </Button>
            </WrapItem>
          ))}
        </Wrap>
      </VStack>
    </Box>
  );
};

const TrackerPage = () => {
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const auth = useAuth();
  const router = useRouter();
  const { getTracker, recordApplicationOutcome } = createApiClient();

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

  const handleSetOutcome = async (matchId: string, outcome: OutcomeKey): Promise<string | null> => {
    const result = await recordApplicationOutcome(matchId, outcome);
    if (result && "error" in result) {
      return result.error as string;
    }
    // Move card: update applicationOutcome in local state only after confirmed success
    setJobs((prev) =>
      prev.map((j) =>
        j._id === matchId ? { ...j, applicationOutcome: outcome } : j
      )
    );
    return null;
  };

  const grouped: Record<TrackerColumn, JobResult[]> = {
    applied: [],
    heard_back: [],
    interviewing: [],
    closed: [],
  };
  for (const job of jobs) {
    grouped[getTrackerColumn(job)].push(job);
  }

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
      </DashboardLayout>
    </>
  );
};

export default TrackerPage;
