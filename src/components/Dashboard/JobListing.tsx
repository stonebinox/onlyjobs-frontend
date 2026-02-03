import {
  Box,
  Badge,
  Heading,
  Text,
  HStack,
  VStack,
  Flex,
  Button,
  Tooltip,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
  Wrap,
  WrapItem,
  useDisclosure,
} from "@chakra-ui/react";
import { Fragment, useState } from "react";
import {
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiTag,
  FiGlobe,
  FiExternalLink,
} from "react-icons/fi";

import { useApi } from "@/hooks/useApi";
import { JobResult } from "@/types/JobResult";
import { Salary } from "@/types/Salary";
import { formatDate } from "@/utils/date-formatter";
import { numberFormatter } from "@/utils/text-formatter";
import { MatchScoreRing } from "./MatchScoreRing";
import { AIReasoningBox } from "./AIReasoningBox";

// Reason categories matching the backend
const REASON_CATEGORIES = {
  salary: "Salary too low",
  location: "Location/remote policy",
  skills_gap: "Missing required skills",
  company_type: "Company size/stage",
  role_mismatch: "Role doesn't match goals",
  job_inactive: "Job no longer available",
  other: "Other",
} as const;

type ReasonCategory = keyof typeof REASON_CATEGORIES;
type Verdict = "Strong match" | "Mild match" | "Weak match" | "No match";

export interface JobListingProps {
  job: JobResult;
  bypassSkippedFiltering?: boolean;
  openJobQuestionsDrawer: (jobResult: JobResult) => void;
  onApplyClick?: (jobResult: JobResult) => void;
}

const getVerdictBorderColor = (verdict: Verdict) => {
  switch (verdict) {
    case "Strong match":
      return "#22C55E";
    case "Mild match":
      return "#3B82F6";
    case "Weak match":
      return "#F59E0B";
    case "No match":
    default:
      return "#EF4444";
  }
};

const JobListing = ({
  job,
  bypassSkippedFiltering = false,
  openJobQuestionsDrawer,
  onApplyClick,
}: JobListingProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [viewed, setViewed] = useState<boolean>(false);
  const [skippedLocally, setSkippedLocally] = useState<boolean>(false);
  const [isSkipping, setIsSkipping] = useState<boolean>(false);
  const [selectedReason, setSelectedReason] = useState<ReasonCategory | null>(
    null
  );
  const [reasonDetails, setReasonDetails] = useState("");
  const { markMatchClick, markMatchAsSkipped } = useApi();
  const {
    isOpen: isReasonModalOpen,
    onOpen: openReasonModal,
    onClose: closeReasonModal,
  } = useDisclosure();

  if (!job.job) return <></>;

  if ((job.skipped || skippedLocally) && !bypassSkippedFiltering) return <></>;

  const {
    matchScore,
    verdict,
    reasoning,
    _id: matchId,
    clicked,
    job: {
      title,
      company,
      location,
      salary,
      tags,
      source,
      description,
      postedDate,
      url,
    },
  } = job;

  const handleSkipClick = () => {
    openReasonModal();
  };

  const handleSkipSubmit = async () => {
    if (!selectedReason) return;

    setIsSkipping(true);
    try {
      await markMatchAsSkipped(
        matchId,
        selectedReason,
        reasonDetails.trim() || undefined
      );
      setSkippedLocally(true);
      closeReasonModal();
    } catch (error) {
      console.error("Error skipping match:", error);
    } finally {
      setIsSkipping(false);
    }
  };

  const handleModalClose = () => {
    setSelectedReason(null);
    setReasonDetails("");
    closeReasonModal();
  };

  const getSalaryString = (salary: Salary) => {
    if (salary.min && salary.max) {
      return `${salary.currency} ${numberFormatter(
        salary.min
      )} - ${numberFormatter(salary.max)}/yr ${
        salary.estimated ? "(est.)" : ""
      }`;
    } else if (salary.min) {
      return `${salary.currency} ${numberFormatter(salary.min)}+/yr ${
        salary.estimated ? "(est.)" : ""
      }`;
    } else if (salary.max) {
      return `Max ${salary.currency} ${numberFormatter(salary.max)}/yr ${
        salary.estimated ? "(est.)" : ""
      }`;
    }

    return "Not specified";
  };

  const formatDescription = (description: string) => {
    const lines = description.split("\n");

    return lines.map((line, index) => (
      <Fragment key={index}>
        <span>{line}</span>
        <br />
      </Fragment>
    ));
  };

  const handleApplyClick = async () => {
    window.open(url, "_blank");
    setViewed(true);
    await markMatchClick(matchId);
    if (onApplyClick) {
      onApplyClick(job);
    }
  };

  const getListingFreshness = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return "Fresh";
    } else if (diffDays < 14) {
      return "Warm";
    } else {
      return "Stale";
    }
  };

  const freshness = getListingFreshness(new Date(postedDate));
  const borderColor = getVerdictBorderColor(verdict as Verdict);

  return (
    <>
      <Box
        position="relative"
        borderRadius="2xl"
        border="1px solid"
        borderColor="surface.border"
        bg={job.skipped ? "gray.50" : "surface.card"}
        overflow="hidden"
        transition="all 0.2s ease"
        _hover={{
          boxShadow: "cardHover",
          borderColor: "primary.200",
          transform: "translateY(-2px)",
        }}
        _before={{
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          background: borderColor,
        }}
      >
        {/* Header Section */}
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "stretch", md: "flex-start" }}
          p={{ base: 4, md: 5 }}
          pl={{ base: 6, md: 7 }}
          gap={4}
          borderBottom="1px solid"
          borderColor="surface.borderSubtle"
        >
          {/* Left: Job Info */}
          <VStack align="start" spacing={2} flex={1}>
            <Heading
              as="h3"
              size={{ base: "sm", md: "md" }}
              fontFamily="heading"
              color="text.primary"
              noOfLines={2}
            >
              {title}
            </Heading>
            <Text
              fontWeight="semibold"
              color="primary.600"
              fontSize={{ base: "sm", md: "md" }}
            >
              {company}
            </Text>

            {/* Metadata Pills */}
            <Wrap spacing={2} mt={2}>
              <WrapItem>
                <HStack
                  px={3}
                  py={1}
                  borderRadius="full"
                  bg="surface.borderSubtle"
                  fontSize="xs"
                  color="text.secondary"
                  fontWeight="medium"
                >
                  <FiMapPin size={12} />
                  <Text>{location.join(", ")}</Text>
                </HStack>
              </WrapItem>
              <WrapItem>
                <HStack
                  px={3}
                  py={1}
                  borderRadius="full"
                  bg="surface.borderSubtle"
                  fontSize="xs"
                  color="text.secondary"
                  fontWeight="medium"
                >
                  <FiDollarSign size={12} />
                  <Text>{getSalaryString(salary)}</Text>
                </HStack>
              </WrapItem>
              <WrapItem>
                <HStack
                  px={3}
                  py={1}
                  borderRadius="full"
                  bg="surface.borderSubtle"
                  fontSize="xs"
                  color="text.secondary"
                  fontWeight="medium"
                >
                  <FiTag size={12} />
                  <Text>{tags.slice(0, 2).join(", ")}</Text>
                </HStack>
              </WrapItem>
              <WrapItem>
                <HStack
                  px={3}
                  py={1}
                  borderRadius="full"
                  bg="surface.borderSubtle"
                  fontSize="xs"
                  color="text.secondary"
                  fontWeight="medium"
                >
                  <FiGlobe size={12} />
                  <Text>{source}</Text>
                </HStack>
              </WrapItem>
            </Wrap>
          </VStack>

          {/* Right: Match Score Ring */}
          <Box
            display="flex"
            flexDirection="column"
            alignItems={{ base: "center", md: "flex-end" }}
            data-guide="job-match-score"
          >
            <MatchScoreRing
              score={matchScore}
              verdict={verdict as Verdict}
              size="md"
            />
          </Box>
        </Flex>

        {/* AI Reasoning Section */}
        <Box
          px={{ base: 4, md: 5 }}
          pl={{ base: 6, md: 7 }}
          py={4}
          bg="surface.borderSubtle"
          data-guide="job-ai-reasoning"
        >
          <AIReasoningBox reasoning={reasoning} />
        </Box>

        {/* Description Section */}
        <Box px={{ base: 4, md: 5 }} pl={{ base: 6, md: 7 }} py={4}>
          <Text
            noOfLines={isExpanded ? undefined : { base: 3, md: 2 }}
            color="text.secondary"
            fontSize={{ base: "sm", md: "md" }}
            lineHeight="relaxed"
          >
            {formatDescription(description)}
          </Text>
        </Box>

        {/* Footer Actions */}
        <Flex
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          align={{ base: "stretch", sm: "center" }}
          px={{ base: 4, md: 5 }}
          pl={{ base: 6, md: 7 }}
          py={3}
          gap={{ base: 3, sm: 0 }}
          borderTop="1px solid"
          borderColor="surface.borderSubtle"
          bg="surface.borderSubtle"
        >
          {/* Left: Timestamp and Freshness */}
          <HStack spacing={3}>
            <HStack spacing={2} fontSize="xs" color="text.tertiary">
              <FiClock size={12} />
              <Text>Posted {formatDate(new Date(postedDate))}</Text>
            </HStack>
            <Tooltip
              label={
                freshness === "Fresh"
                  ? "Posted less than a week ago"
                  : freshness === "Warm"
                  ? "Posted 1-2 weeks ago"
                  : "Posted more than 2 weeks ago"
              }
              placement="top"
              hasArrow
            >
              <Badge
                variant={freshness.toLowerCase()}
                fontSize="xx-small"
                px={2}
                py={0.5}
                borderRadius="full"
                bg={
                  freshness === "Fresh"
                    ? "freshness.fresh"
                    : freshness === "Warm"
                    ? "freshness.warm"
                    : "freshness.stale"
                }
                color="white"
                data-guide="job-listing-health"
              >
                {freshness}
              </Badge>
            </Tooltip>
          </HStack>

          {/* Right: Action Buttons */}
          <HStack spacing={2} flexWrap="wrap">
            {(clicked || viewed || job.skipped) && (
              <Badge
                colorScheme={job.skipped ? "orange" : "green"}
                fontSize={{ base: "xs", md: "sm" }}
                px={2}
                py={1}
                borderRadius="full"
              >
                {job.skipped ? "Skipped" : "Visited"} {formatDate(new Date(job.updatedAt))}
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openJobQuestionsDrawer(job)}
              data-guide="job-application-help"
            >
              Get Help
            </Button>
            {!job.skipped && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSkipClick}
              >
                Skip
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Less" : "More"}
            </Button>
            <Button
              size="sm"
              colorScheme="blue"
              onClick={handleApplyClick}
              leftIcon={<FiExternalLink />}
            >
              Apply
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Skip Reason Modal */}
      <Modal
        isOpen={isReasonModalOpen}
        onClose={handleModalClose}
        size={{ base: "full", sm: "md" }}
        motionPreset="slideInBottom"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent mx={{ base: 0, sm: 4 }} my={{ base: 0, sm: "auto" }}>
          <ModalHeader fontSize={{ base: "lg", sm: "md" }}>
            Why are you skipping this job?
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <Text fontSize="sm" color="text.secondary" mb={4}>
              Help us improve your matches by telling us why this job
              isn&apos;t right for you.
            </Text>
            <Wrap spacing={2}>
              {(Object.keys(REASON_CATEGORIES) as ReasonCategory[]).map(
                (category) => (
                  <WrapItem key={category}>
                    <Button
                      size={{ base: "md", sm: "sm" }}
                      variant={
                        selectedReason === category ? "solid" : "outline"
                      }
                      colorScheme={
                        selectedReason === category ? "blue" : "gray"
                      }
                      onClick={() => setSelectedReason(category)}
                    >
                      {REASON_CATEGORIES[category]}
                    </Button>
                  </WrapItem>
                )
              )}
            </Wrap>

            {selectedReason && (
              <Textarea
                mt={4}
                placeholder={
                  selectedReason === "other"
                    ? "Please tell us more..."
                    : "Add details (optional)"
                }
                size="sm"
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                rows={3}
              />
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={handleModalClose}
              size={{ base: "md", sm: "sm" }}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSkipSubmit}
              isDisabled={!selectedReason}
              isLoading={isSkipping}
              loadingText="Skipping..."
              size={{ base: "md", sm: "sm" }}
            >
              Skip Job
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default JobListing;
