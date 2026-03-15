import {
  Box,
  Flex,
  Skeleton,
  Text,
  Button,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Wrap,
  WrapItem,
  useDisclosure,
} from "@chakra-ui/react";
import styled from "styled-components";
import { useMemo, useState } from "react";

import { JobResult } from "@/types/JobResult";
import { useApi } from "@/hooks/useApi";
import JobListing from "./JobListing";

const StyledSkeleton = styled(Skeleton)`
  width: 100%;
  height: auto;
  padding: 16px;
  border-radius: 8px;
`;

const OUTCOME_OPTIONS = {
  heard_back: { label: "Heard Back", color: "blue" },
  interview: { label: "Got Interview", color: "green" },
  offer: { label: "Got Offer", color: "green" },
  rejected: { label: "Rejected", color: "red" },
  no_response: { label: "No Response", color: "gray" },
} as const;

type OutcomeKey = keyof typeof OUTCOME_OPTIONS;

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

interface AppliedJobsProps {
  loading: boolean;
  jobs: JobResult[];
  openJobQuestionsDrawer: (jobResult: JobResult) => void;
  onApplyClick?: (jobResult: JobResult) => void;
}

export const AppliedJobs = ({
  loading,
  jobs,
  openJobQuestionsDrawer,
  onApplyClick,
}: AppliedJobsProps) => {
  const [selectedJob, setSelectedJob] = useState<JobResult | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outcomeOverrides, setOutcomeOverrides] = useState<Record<string, string>>({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { recordApplicationOutcome } = useApi();

  const appliedJobs = useMemo(() => {
    return jobs
      .filter((job) => job.applied === true)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [jobs]);

  const handleOpenModal = (job: JobResult) => {
    setSelectedJob(job);
    setSelectedOutcome(null);
    onOpen();
  };

  const handleModalClose = () => {
    setSelectedJob(null);
    setSelectedOutcome(null);
    onClose();
  };

  const handleSubmitOutcome = async () => {
    if (!selectedJob || !selectedOutcome) return;
    setIsSubmitting(true);
    try {
      const result = await recordApplicationOutcome(selectedJob._id, selectedOutcome);
      if (!result?.error) {
        setOutcomeOverrides((prev) => ({
          ...prev,
          [selectedJob._id]: selectedOutcome,
        }));
      } else {
        console.error("Failed to record outcome:", result.error);
      }
    } catch (error) {
      console.error("Error recording outcome:", error);
    } finally {
      setIsSubmitting(false);
      handleModalClose();
    }
  };

  const getOutcome = (job: JobResult): string | undefined => {
    return outcomeOverrides[job._id] ?? job.applicationOutcome;
  };

  const isStale = (job: JobResult): boolean => {
    const appliedDate = job.appliedAt ? new Date(job.appliedAt).getTime() : new Date(job.updatedAt).getTime();
    return Date.now() - appliedDate >= FOURTEEN_DAYS_MS;
  };

  return (
    <Flex direction="column">
      <StyledSkeleton isLoaded={!loading}>
        <Box p={4}>
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Applied Jobs &bull; {appliedJobs.length} jobs
          </Text>
        </Box>
        {appliedJobs.length > 0 ? (
          <Flex direction="column" gap={4}>
            {appliedJobs.map((job) => {
              const outcome = getOutcome(job);
              const stale = isStale(job);

              return (
                <Box key={job._id}>
                  <JobListing
                    job={job}
                    openJobQuestionsDrawer={openJobQuestionsDrawer}
                    onApplyClick={onApplyClick}
                  />
                  <Box px={4} pb={3}>
                    {outcome ? (
                      <Badge
                        colorScheme={OUTCOME_OPTIONS[outcome as OutcomeKey]?.color ?? "gray"}
                        fontSize="xs"
                        px={2}
                        py={1}
                        borderRadius="md"
                      >
                        {OUTCOME_OPTIONS[outcome as OutcomeKey]?.label ?? outcome}
                      </Badge>
                    ) : stale ? (
                      <Flex
                        align="center"
                        gap={3}
                        bg="yellow.50"
                        border="1px solid"
                        borderColor="yellow.300"
                        borderRadius="md"
                        px={3}
                        py={2}
                      >
                        <Text fontSize="sm" color="yellow.800" fontWeight="medium">
                          How did it go?
                        </Text>
                        <Button
                          size="xs"
                          colorScheme="yellow"
                          variant="solid"
                          onClick={() => handleOpenModal(job)}
                        >
                          Update Status
                        </Button>
                      </Flex>
                    ) : (
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="gray"
                        onClick={() => handleOpenModal(job)}
                      >
                        Update Status
                      </Button>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Flex>
        ) : (
          <Flex p={4} direction="column">
            <Text>You haven&apos;t applied to any jobs yet.</Text>
          </Flex>
        )}
      </StyledSkeleton>

      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        size={{ base: "full", sm: "md" }}
        motionPreset="slideInBottom"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent mx={{ base: 0, sm: 4 }} my={{ base: 0, sm: "auto" }}>
          <ModalHeader fontSize={{ base: "lg", sm: "md" }}>
            {selectedJob?.job?.title
              ? `${selectedJob.job.title}${selectedJob.job.company ? ` — ${selectedJob.job.company}` : ""}`
              : "Update Application Status"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <Text fontSize="sm" color="text.secondary" mb={4}>
              What happened with this application?
            </Text>
            <Wrap spacing={2}>
              {(Object.keys(OUTCOME_OPTIONS) as OutcomeKey[]).map((key) => (
                <WrapItem key={key}>
                  <Button
                    size={{ base: "md", sm: "sm" }}
                    variant={selectedOutcome === key ? "solid" : "outline"}
                    colorScheme={selectedOutcome === key ? "blue" : "gray"}
                    onClick={() => setSelectedOutcome(key)}
                  >
                    {OUTCOME_OPTIONS[key].label}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>
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
              onClick={handleSubmitOutcome}
              isDisabled={!selectedOutcome}
              isLoading={isSubmitting}
              loadingText="Saving..."
              size={{ base: "md", sm: "sm" }}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};
