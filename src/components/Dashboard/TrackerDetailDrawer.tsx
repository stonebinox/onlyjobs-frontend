import type { ReactNode } from "react";
import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  VStack,
  useBreakpointValue,
} from "@chakra-ui/react";
import { FiCheck, FiChevronDown, FiExternalLink } from "react-icons/fi";

import { JobResult } from "@/types/JobResult";
import { OUTCOME_OPTIONS, OutcomeKey } from "@/components/Dashboard/FollowUpWizardModal";
import { MatchScoreRing } from "@/components/Dashboard/MatchScoreRing";
import { GenerateAnswer } from "@/components/Dashboard/GenerateAnswer";
import { isSafeUrl } from "@/utils/brief-utils";

const MOVE_OPTIONS: { label: string; outcome: OutcomeKey }[] = [
  { label: "Heard back",           outcome: "heard_back"  },
  { label: "Interviewing",         outcome: "interview"   },
  { label: "Closed · Got offer",   outcome: "offer"       },
  { label: "Closed · Rejected",    outcome: "rejected"    },
  { label: "Closed · No response", outcome: "no_response" },
];

const formatDate = (dateStr: string | undefined): string | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const OutcomeBadge = ({ outcome }: { outcome: string }) => {
  if (outcome === "offer") {
    return <Badge colorScheme="green" fontSize="xs" px={2} py={0.5}>Got Offer 🎉</Badge>;
  }
  const opt = OUTCOME_OPTIONS[outcome as OutcomeKey];
  if (!opt) {
    return <Badge colorScheme="gray" fontSize="xs" px={2} py={0.5}>{outcome}</Badge>;
  }
  return <Badge colorScheme={opt.color} fontSize="xs" px={2} py={0.5}>{opt.label}</Badge>;
};

interface TrackerDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobResult | null;
  onSetOutcome: (matchId: string, outcome: OutcomeKey) => Promise<string | null>;
  // Phase 2 slot — onlyjobs-78n will pass AI chat here; renders nothing in phase 1
  aiSection?: ReactNode;
}

export const TrackerDetailDrawer = ({
  isOpen,
  onClose,
  job,
  onSetOutcome,
  aiSection,
}: TrackerDetailDrawerProps) => {
  const drawerSize = useBreakpointValue({ base: "full", md: "xl" }) as "full" | "xl";
  const [submitting, setSubmitting] = useState<OutcomeKey | null>(null);

  const handleOutcome = async (outcome: OutcomeKey) => {
    if (!job) return;
    setSubmitting(outcome);
    try {
      await onSetOutcome(job._id, outcome);
    } finally {
      setSubmitting(null);
    }
  };

  const title = job?.job?.title ?? "Listing no longer available";
  const company = job?.job?.company;
  const jobUrl = job?.job?.url;
  const appliedDate = formatDate(job?.appliedAt);
  const postedDate = formatDate(job?.job?.postedDate);
  const scrapedDate = formatDate(job?.job?.scrapedDate);

  return (
    <Drawer placement="right" size={drawerSize} isOpen={isOpen} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader pr={12}>
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold" fontSize="lg" lineHeight="short">
              {title}
              {company && (
                <Text as="span" fontWeight="normal" color="text.secondary">
                  {" @ "}{company}
                </Text>
              )}
            </Text>
            {jobUrl && isSafeUrl(jobUrl) && (
              <Link
                fontSize="sm"
                color="primary.600"
                href={jobUrl}
                onClick={(e) => {
                  e.preventDefault();
                  window.open(jobUrl, "_blank", "noopener,noreferrer");
                }}
                display="inline-flex"
                alignItems="center"
                gap={1}
              >
                Open listing <FiExternalLink size={12} />
              </Link>
            )}
          </VStack>
        </DrawerHeader>

        <DrawerBody>
          <VStack align="stretch" spacing={5} pb={8}>
            {/* STATUS */}
            <Box>
              <Text fontWeight="semibold" fontSize="sm" mb={2} color="text.secondary">
                Status
              </Text>
              <VStack align="start" spacing={2}>
                {job?.applicationOutcome ? (
                  <OutcomeBadge outcome={job.applicationOutcome} />
                ) : (
                  <Badge colorScheme="gray" fontSize="xs" px={2} py={0.5}>Applied</Badge>
                )}
                {appliedDate && (
                  <Text fontSize="xs" color="text.tertiary">Applied {appliedDate}</Text>
                )}
                <Menu>
                  <MenuButton
                    as={Button}
                    rightIcon={<FiChevronDown />}
                    size="sm"
                    variant="outline"
                    isLoading={submitting !== null}
                    isDisabled={submitting !== null || !job}
                  >
                    Move to
                  </MenuButton>
                  <MenuList>
                    {MOVE_OPTIONS.map(({ label, outcome }) => (
                      <MenuItem
                        key={outcome}
                        onClick={() => handleOutcome(outcome)}
                        isDisabled={job?.applicationOutcome === outcome || submitting !== null}
                        icon={job?.applicationOutcome === outcome ? <FiCheck /> : undefined}
                      >
                        {label}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              </VStack>
            </Box>

            <Divider />

            {/* MATCH */}
            {job !== null && job.matchScore !== undefined && (
              <>
                <Box>
                  <Text fontWeight="semibold" fontSize="sm" mb={3} color="text.secondary">
                    Match
                  </Text>
                  <HStack align="start" spacing={4}>
                    <MatchScoreRing
                      score={job.matchScore}
                      verdict={job.verdict ?? "No match"}
                    />
                    {job.reasoning && (
                      <Text fontSize="sm" color="text.secondary" flex={1}>
                        {job.reasoning}
                      </Text>
                    )}
                  </HStack>
                </Box>
                <Divider />
              </>
            )}

            {/* DETAILS */}
            <Box>
              <Text fontWeight="semibold" fontSize="sm" mb={2} color="text.secondary">
                Details
              </Text>
              {job?.job?.description ? (
                <Box
                  maxH="300px"
                  overflowY="auto"
                  fontSize="sm"
                  color="text.secondary"
                  whiteSpace="pre-wrap"
                  lineHeight="1.6"
                >
                  {job.job.description}
                </Box>
              ) : (
                <Text fontSize="sm" color="text.tertiary">No description available.</Text>
              )}
              <VStack align="start" spacing={1} mt={3}>
                {job?.freshness && (
                  <Text fontSize="xs" color="text.tertiary">Freshness: {job.freshness}</Text>
                )}
                {postedDate && (
                  <Text fontSize="xs" color="text.tertiary">Posted: {postedDate}</Text>
                )}
                {scrapedDate && (
                  <Text fontSize="xs" color="text.tertiary">Scraped: {scrapedDate}</Text>
                )}
              </VStack>
            </Box>

            <Divider />

            {/* Q&A */}
            <Box>
              {job?._id && <GenerateAnswer jobResultId={job._id} />}
            </Box>

            {/* Phase 2 slot — renders nothing in phase 1; onlyjobs-78n fills this */}
            {aiSection ?? null}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};
