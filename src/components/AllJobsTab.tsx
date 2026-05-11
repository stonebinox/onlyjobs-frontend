import {
  Box,
  Button,
  Text,
  HStack,
  VStack,
  Badge,
  Tooltip,
  Skeleton,
  Flex,
  Wrap,
  WrapItem,
  Heading,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useState, useEffect, useCallback } from "react";
import { FiExternalLink, FiMapPin, FiDollarSign } from "react-icons/fi";

import { createApiClient } from "@/lib/apiClient";
import { User } from "@/types/User";
import { JobResult } from "@/types/JobResult";
import { MatchScoreRing } from "@/components/Dashboard/MatchScoreRing";
import JobListing from "@/components/Dashboard/JobListing";

interface RawJob {
  _id: string;
  title: string;
  company: string;
  location: string[];
  salary?: { min?: number; max?: number; currency?: string };
  source: string;
  description: string;
  url: string;
  postedDate: string;
  match: {
    _id: string;
    matchScore: number;
    verdict: string;
    reasoning: string;
    skipped: boolean;
    applied: boolean | null;
    updatedAt: string;
  } | null;
}

interface AllJobsTabProps {
  user: User | null;
  walletBalance: number | null;
  openJobQuestionsDrawer: (jobResult: JobResult) => void;
  onApplyClick?: (jobResult: JobResult) => void;
  onBalanceChange?: (newBalance: number) => void;
}

function toJobResult(job: RawJob): JobResult {
  return {
    _id: job.match!._id,
    userId: "",
    jobId: job._id,
    matchScore: job.match!.matchScore,
    verdict: job.match!.verdict,
    reasoning: job.match!.reasoning,
    clicked: false,
    createdAt: "",
    updatedAt: job.match!.updatedAt || new Date().toISOString(),
    skipped: job.match!.skipped,
    applied: job.match!.applied,
    job: {
      _id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: {
        min: job.salary?.min ?? 0,
        max: job.salary?.max ?? 0,
        currency: job.salary?.currency ?? "USD",
        estimated: false,
      },
      tags: [],
      source: job.source,
      description: job.description,
      url: job.url,
      createdAt: "",
      updatedAt: "",
      postedDate: job.postedDate,
      scrapedDate: "",
    },
  };
}

function hasValidResume(user: User | null): boolean {
  if (!user?.resume) return false;
  return (
    (user.resume.summary?.trim().length > 0) ||
    (Array.isArray(user.resume.skills) && user.resume.skills.length > 0) ||
    (Array.isArray(user.resume.experience) && user.resume.experience.length > 0)
  );
}

function formatPostedDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

export const AllJobsTab = ({ user, walletBalance, openJobQuestionsDrawer, onApplyClick, onBalanceChange }: AllJobsTabProps) => {
  const [jobs, setJobs] = useState<RawJob[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchingJobId, setMatchingJobId] = useState<string | null>(null);
  const [matchErrors, setMatchErrors] = useState<Record<string, string>>({});

  const { getAllJobs, matchJobOnDemand } = createApiClient();

  const hasResume = hasValidResume(user);
  const hasSufficientBalance = walletBalance !== null && walletBalance >= 0.05;

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllJobs(page, selectedSource);
      if (data.error) {
        setError(data.error);
        return;
      }
      setJobs(data.jobs);
      setTotalPages(data.pages);
      setTotal(data.total);
      if (data.sources) setSources(data.sources);
    } catch (err) {
      setError("Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedSource]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSourceChange = (source: string | undefined) => {
    setSelectedSource(source);
    setPage(1);
  };

  const handleMatchJob = async (job: RawJob) => {
    setMatchingJobId(job._id);
    setMatchErrors((prev) => ({ ...prev, [job._id]: "" }));
    try {
      const result = await matchJobOnDemand(job._id);
      // Update job in-place with the new match result
      setJobs((prev) =>
        prev.map((j) =>
          j._id === job._id ? { ...j, match: result.match } : j
        )
      );
      if (onBalanceChange && walletBalance !== null) {
        onBalanceChange(walletBalance - 0.05);
      }
    } catch (err: any) {
      const msg = err.message || "Match failed. Please try again.";
      setMatchErrors((prev) => ({ ...prev, [job._id]: msg }));
    } finally {
      setMatchingJobId(null);
    }
  };

  const getMatchCTATooltip = (): string | undefined => {
    if (!hasResume) return "Upload your CV first";
    if (!hasSufficientBalance) return "Insufficient balance";
    return undefined;
  };

  const isMatchCTADisabled = !hasResume || !hasSufficientBalance;

  if (error) {
    return (
      <Alert status="error" borderRadius="xl" mt={4}>
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Source filter pills */}
      <Wrap spacing={2} mb={6} mt={2}>
        <WrapItem>
          <Button
            size="sm"
            variant={selectedSource === undefined ? "solid" : "outline"}
            colorScheme="purple"
            borderRadius="full"
            onClick={() => handleSourceChange(undefined)}
          >
            All Sources
          </Button>
        </WrapItem>
        {sources.map((src) => (
          <WrapItem key={src}>
            <Button
              size="sm"
              variant={selectedSource === src ? "solid" : "outline"}
              colorScheme="purple"
              borderRadius="full"
              onClick={() => handleSourceChange(src)}
              textTransform="capitalize"
            >
              {src}
            </Button>
          </WrapItem>
        ))}
      </Wrap>

      {/* Total count */}
      {!loading && (
        <Text fontSize="sm" color="text.tertiary" mb={4}>
          {total} job{total !== 1 ? "s" : ""} found
        </Text>
      )}

      {/* Job list */}
      <VStack spacing={4} align="stretch">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height="120px" borderRadius="2xl" />
            ))
          : jobs.map((job) =>
              job.match !== null ? (
                <JobListing
                  key={job._id}
                  job={toJobResult(job)}
                  bypassSkippedFiltering
                  openJobQuestionsDrawer={openJobQuestionsDrawer}
                  onApplyClick={onApplyClick}
                />
              ) : (
                <JobCard
                  key={job._id}
                  job={job}
                  isMatchingThisJob={matchingJobId === job._id}
                  isMatchCTADisabled={isMatchCTADisabled || matchingJobId !== null}
                  matchCTATooltip={getMatchCTATooltip()}
                  matchError={matchErrors[job._id]}
                  onMatch={() => handleMatchJob(job)}
                />
              )
            )}
      </VStack>

      {jobs.length === 0 && !loading && (
        <Box
          textAlign="center"
          py={12}
          borderRadius="2xl"
          bg="surface.card"
          border="1px dashed"
          borderColor="surface.border"
          mt={4}
        >
          <Text color="text.secondary" fontSize="sm">
            No jobs found{selectedSource ? ` from ${selectedSource}` : ""}.
          </Text>
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <HStack justify="center" mt={6} spacing={3}>
          <Button
            size="sm"
            variant="outline"
            isDisabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Text fontSize="sm" color="text.secondary">
            Page {page} of {totalPages}
          </Text>
          <Button
            size="sm"
            variant="outline"
            isDisabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </HStack>
      )}
    </Box>
  );
};

interface JobCardProps {
  job: RawJob;
  isMatchingThisJob: boolean;
  isMatchCTADisabled: boolean;
  matchCTATooltip?: string;
  matchError?: string;
  onMatch: () => void;
}

const JobCard = ({
  job,
  isMatchingThisJob,
  isMatchCTADisabled,
  matchCTATooltip,
  matchError,
  onMatch,
}: JobCardProps) => {
  const hasMatch = job.match !== null;

  return (
    <Box
      p={5}
      borderRadius="2xl"
      border="1px solid"
      borderColor="surface.border"
      bg="surface.card"
      boxShadow="card"
      _hover={{ boxShadow: "cardHover", borderColor: "primary.200" }}
    >
      <Flex gap={4} align="flex-start">
        {/* Match score (if analyzed) */}
        {hasMatch && (
          <Box flexShrink={0}>
            <MatchScoreRing
              score={job.match!.matchScore}
              verdict={job.match!.verdict as any}
              size="sm"
            />
          </Box>
        )}

        {/* Job info */}
        <Box flex={1} minW={0}>
          <HStack spacing={2} mb={1} flexWrap="wrap">
            <Heading size="sm" noOfLines={1} color="text.primary">
              {job.title}
            </Heading>
            <Badge colorScheme="gray" fontSize="xs" textTransform="capitalize">
              {job.source}
            </Badge>
            {hasMatch && (
              <Badge colorScheme="purple" fontSize="xs">
                Analyzed
              </Badge>
            )}
          </HStack>

          <Text fontSize="sm" color="text.secondary" fontWeight="medium" mb={2}>
            {job.company}
          </Text>

          {job.location && job.location.length > 0 && (
            <HStack spacing={1} mb={1}>
              <FiMapPin size="12px" color="var(--chakra-colors-text-tertiary)" />
              <Text fontSize="xs" color="text.tertiary">
                {job.location.join(", ")}
              </Text>
            </HStack>
          )}

          {job.salary && (job.salary.min || job.salary.max) && (
            <HStack spacing={1} mb={1}>
              <FiDollarSign size="12px" color="var(--chakra-colors-text-tertiary)" />
              <Text fontSize="xs" color="text.tertiary">
                {job.salary.min && job.salary.max
                  ? `${job.salary.min.toLocaleString()} – ${job.salary.max.toLocaleString()} ${job.salary.currency || "USD"}`
                  : job.salary.min
                  ? `From ${job.salary.min.toLocaleString()} ${job.salary.currency || "USD"}`
                  : `Up to ${job.salary.max!.toLocaleString()} ${job.salary.currency || "USD"}`}
              </Text>
            </HStack>
          )}

          <Text fontSize="xs" color="text.tertiary" mt={1}>
            {formatPostedDate(job.postedDate)}
          </Text>

          {matchError && (
            <Text fontSize="xs" color="red.500" mt={2}>
              {matchError}
            </Text>
          )}
        </Box>

        {/* Actions */}
        <VStack spacing={2} align="flex-end" flexShrink={0}>
          <Button
            as="a"
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            variant="outline"
            rightIcon={<FiExternalLink />}
          >
            View
          </Button>

          {!hasMatch && (
            <Tooltip
              label={matchCTATooltip}
              isDisabled={!matchCTATooltip}
              hasArrow
            >
              <Button
                size="sm"
                colorScheme="purple"
                isDisabled={isMatchCTADisabled}
                isLoading={isMatchingThisJob}
                loadingText="Analyzing"
                onClick={onMatch}
              >
                Check Compatibility ($0.05)
              </Button>
            </Tooltip>
          )}
        </VStack>
      </Flex>
    </Box>
  );
};

export default AllJobsTab;
