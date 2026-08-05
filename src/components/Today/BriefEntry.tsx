import {
  Box,
  Badge,
  Button,
  Text,
  VStack,
  HStack,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Textarea,
  Wrap,
  WrapItem,
  useDisclosure,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
} from "@chakra-ui/react";
import { Fragment, useState } from "react";
import { createApiClient } from "@/lib/apiClient";
import { JobResult } from "@/types/JobResult";
import { Salary } from "@/types/Salary";
import { numberFormatter } from "@/utils/text-formatter";
import { trackEvent } from "@/utils/analytics";
import { getOddsLine, getOddsColor, isSafeUrl } from "@/utils/brief-utils";
import { getVerdictRing } from "@/utils/verdict-colors";

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

export interface BriefEntryProps {
  entry: JobResult;
  onSkipped: (matchId: string) => void;
  onOpenListing?: (jobResult: JobResult) => void;
}

const getSalaryString = (salary: Salary): string => {
  if (!salary) return "";
  if (salary.min && salary.max) {
    return `${salary.currency} ${numberFormatter(salary.min)}–${numberFormatter(salary.max)}/yr${salary.estimated ? " (est.)" : ""}`;
  } else if (salary.min) {
    return `${salary.currency} ${numberFormatter(salary.min)}+/yr${salary.estimated ? " (est.)" : ""}`;
  } else if (salary.max) {
    return `Max ${salary.currency} ${numberFormatter(salary.max)}/yr${salary.estimated ? " (est.)" : ""}`;
  }
  return "";
};


export const BriefEntry = ({ entry, onSkipped, onOpenListing }: BriefEntryProps) => {
  const [isSkipping, setIsSkipping] = useState(false);
  const [skipError, setSkipError] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<ReasonCategory | null>(null);
  const [reasonDetails, setReasonDetails] = useState("");

  const { isOpen: isSkipModalOpen, onOpen: openSkipModal, onClose: closeSkipModal } = useDisclosure();
  const { isOpen: isDetailsOpen, onOpen: openDetails, onClose: closeDetails } = useDisclosure();

  const toast = useToast();
  const { markMatchClick, markMatchAsSkipped } = createApiClient();

  if (!entry.job) return null;

  const { matchScore, verdict, reasoning, _id: matchId, createdAt: matchCreatedAt, job } = entry;
  const { _id: jobId, title, company, location, salary, source, description, postedDate, scrapedDate, url } = job;

  const oddsLine = getOddsLine(postedDate);
  const oddsColor = getOddsColor(postedDate);
  const salaryStr = getSalaryString(salary);
  const vc = getVerdictRing(verdict);

  const metaParts = [
    title,
    company,
    salaryStr || null,
    location && location.length > 0 ? location.join(", ") : null,
  ].filter(Boolean);

  const handleOpenListing = async () => {
    if (!isSafeUrl(url)) {
      toast({ title: "Cannot open listing — invalid URL", status: "error", duration: 3000, isClosable: true });
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    onOpenListing?.(entry);
    try {
      const result = await markMatchClick(matchId);
      if (result && "error" in result) {
        toast({ title: "Could not record visit", status: "warning", duration: 3000, isClosable: true });
      }
    } catch {
      toast({ title: "Could not record visit", status: "warning", duration: 3000, isClosable: true });
    }
    // Card stays visible regardless — no local state change.
  };

  const handleSkipSubmit = async () => {
    if (!selectedReason) return;
    setIsSkipping(true);
    setSkipError(null);
    try {
      const result = await markMatchAsSkipped(matchId, selectedReason, reasonDetails.trim() || undefined);
      if (result && "error" in result) {
        setSkipError(typeof result.error === "string" ? result.error : "Failed to skip. Try again.");
        return;
      }
      trackEvent("match_skipped", { reason: selectedReason });
      closeSkipModal();
      setSelectedReason(null);
      setReasonDetails("");
      // Only remove the card after confirmed API success.
      onSkipped(matchId);
    } catch {
      setSkipError("Failed to skip. Try again.");
    } finally {
      setIsSkipping(false);
    }
  };

  const handleSkipModalClose = () => {
    setSelectedReason(null);
    setReasonDetails("");
    setSkipError(null);
    closeSkipModal();
  };

  const postedDateDisplay =
    postedDate && !isNaN(new Date(postedDate).getTime())
      ? new Date(postedDate).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;

  return (
    <>
      <Box
        width="100%"
        borderRadius="2xl"
        border="1px solid"
        borderColor="surface.border"
        bg="surface.card"
        p={{ base: 4, md: 5 }}
        overflowWrap="break-word"
        wordBreak="break-word"
      >
        <VStack align="start" spacing={3}>
          {/* 1. Verdict chip with score inline */}
          <Badge
            bg={vc.badgeBg}
            color={vc.badgeText}
            fontSize="sm"
            px={3}
            py={1}
            borderRadius="full"
            fontWeight="semibold"
          >
            {verdict} · {matchScore}
          </Badge>

          {/* 2. Reasoning — visually dominant, first content after chip */}
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            fontWeight="medium"
            color="text.primary"
            lineHeight="tall"
          >
            {reasoning}
          </Text>

          {/* 3. Job metadata line */}
          <Text fontSize="sm" color="text.secondary" lineHeight="short">
            {metaParts.join(" · ")}
          </Text>

          {/* 4. Odds line — always shown; neutral copy when date is missing or unparseable */}
          <Text fontSize="sm" color={oddsColor}>
            {oddsLine}
          </Text>

          {/* 5. Actions */}
          <HStack spacing={2} flexWrap="wrap" pt={1}>
            <Button size="sm" colorScheme="blue" onClick={handleOpenListing}>
              Open listing
            </Button>
            <Button size="sm" variant="ghost" onClick={openSkipModal}>
              Not for me
            </Button>
            <Button size="sm" variant="ghost" onClick={openDetails}>
              Details
            </Button>
          </HStack>
        </VStack>
      </Box>

      {/* Skip Reason Modal — same contract as JobListing for preference learning */}
      <Modal
        isOpen={isSkipModalOpen}
        onClose={handleSkipModalClose}
        size={{ base: "full", sm: "md" }}
        motionPreset="slideInBottom"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent mx={{ base: 0, sm: 4 }} my={{ base: 0, sm: "auto" }}>
          <ModalHeader fontSize={{ base: "lg", sm: "md" }}>
            Why is this one not for you?
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <Text fontSize="sm" color="text.secondary" mb={4}>
              Your reason helps us improve your future matches.
            </Text>
            <Wrap spacing={2}>
              {(Object.keys(REASON_CATEGORIES) as ReasonCategory[]).map((category) => (
                <WrapItem key={category}>
                  <Button
                    size={{ base: "md", sm: "sm" }}
                    variant={selectedReason === category ? "solid" : "outline"}
                    colorScheme={selectedReason === category ? "blue" : "gray"}
                    onClick={() => setSelectedReason(category)}
                  >
                    {REASON_CATEGORIES[category]}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>
            {selectedReason && (
              <Textarea
                mt={4}
                placeholder={
                  selectedReason === "other"
                    ? "Please tell us more..."
                    : "Add details (optional)"
                }
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                size="sm"
                resize="vertical"
                borderRadius="lg"
              />
            )}
            {skipError && (
              <Alert status="error" mt={3} borderRadius="lg">
                <AlertIcon />
                <AlertDescription fontSize="sm">{skipError}</AlertDescription>
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleSkipModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleSkipSubmit}
              isLoading={isSkipping}
              isDisabled={!selectedReason}
            >
              Skip this job
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Details Drawer — source + full description + debug info */}
      <Drawer isOpen={isDetailsOpen} onClose={closeDetails} placement="right" size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <Text noOfLines={2} fontFamily="heading">
              {title}
            </Text>
            <Text fontSize="sm" fontWeight="normal" color="text.secondary" mt={1}>
              {company}
            </Text>
          </DrawerHeader>
          <DrawerBody overflowY="auto">
            <VStack align="start" spacing={5} pt={2} pb={6}>
              <HStack spacing={6} flexWrap="wrap">
                <Box>
                  <Text
                    fontSize="xs"
                    color="text.tertiary"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    mb={0.5}
                  >
                    Source
                  </Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {source}
                  </Text>
                </Box>
                <Box>
                  <Text
                    fontSize="xs"
                    color="text.tertiary"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    mb={0.5}
                  >
                    Match score
                  </Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {matchScore}
                  </Text>
                </Box>
                {postedDateDisplay && (
                  <Box>
                    <Text
                      fontSize="xs"
                      color="text.tertiary"
                      textTransform="uppercase"
                      letterSpacing="wide"
                      mb={0.5}
                    >
                      Posted
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {postedDateDisplay}
                    </Text>
                  </Box>
                )}
              </HStack>

              <Box width="100%">
                <Text
                  fontSize="xs"
                  color="text.tertiary"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  mb={2}
                >
                  Description
                </Text>
                <Text
                  fontSize="sm"
                  color="text.secondary"
                  lineHeight="tall"
                  overflowWrap="break-word"
                  wordBreak="break-word"
                >
                  {description.split("\n").map((line, i) => (
                    <Fragment key={i}>
                      <span>{line}</span>
                      <br />
                    </Fragment>
                  ))}
                </Text>
              </Box>

              {/* Diagnostic block — trace provenance without a dev environment */}
              <Box
                width="100%"
                borderLeft="2px solid"
                borderColor="text.tertiary"
                pl={3}
                py={1}
              >
                <Text
                  fontSize="xs"
                  color="text.tertiary"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  mb={2}
                  fontWeight="semibold"
                >
                  Diagnostic
                </Text>
                <Box fontFamily="mono" fontSize="xs" color="text.secondary">
                  <Text wordBreak="break-all">match_id: {matchId}</Text>
                  <Text wordBreak="break-all">job_id: {jobId}</Text>
                  <Text wordBreak="break-all">url: {url}</Text>
                  <Text>scraped: {scrapedDate ?? "—"}</Text>
                  <Text>posted_raw: {postedDate ?? "—"}</Text>
                  <Text>match_at: {matchCreatedAt}</Text>
                </Box>
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};
