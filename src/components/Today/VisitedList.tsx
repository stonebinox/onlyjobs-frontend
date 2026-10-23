import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Center,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  Textarea,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useState } from "react";

import { createApiClient } from "@/lib/apiClient";
import { JobResult } from "@/types/JobResult";
import { RejectionSignalSummary } from "@/types/RejectionSignalSummary";
import { trackEvent } from "@/utils/analytics";
import { isSafeUrl } from "@/utils/brief-utils";

export const REASON_LABELS: Record<string, string> = {
  salary: "Salary too low",
  location: "Location/remote policy",
  skills_gap: "Missing required skills",
  company_type: "Company size/stage",
  role_mismatch: "Role doesn't match goals",
  job_inactive: "Job no longer available",
  other: "Other",
};

interface VisitedListProps {
  rows: JobResult[];
  loading: boolean;
  error: string | null;
  onOpenDrawer: (row: JobResult) => void;
  onApplied: (matchId: string) => void;
  onSkipped: (matchId: string, signal?: RejectionSignalSummary | null) => void;
}

export const VisitedList = ({
  rows,
  loading,
  error,
  onOpenDrawer,
  onApplied,
  onSkipped,
}: VisitedListProps) => {
  const { markMatchApplied, markMatchAsSkipped } = createApiClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [skipTarget, setSkipTarget] = useState<JobResult | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [reasonDetails, setReasonDetails] = useState("");
  const [skipError, setSkipError] = useState<string | null>(null);

  if (loading) {
    return (
      <Center py={20} w="100%">
        <Spinner size="lg" color="primary.400" />
      </Center>
    );
  }
  if (error) return <Text color="red.500">{error}</Text>;
  if (rows.length === 0) {
    return (
      <Box
        p={6}
        borderRadius="2xl"
        border="1px dashed"
        borderColor="surface.border"
        bg="surface.card"
        width="100%"
      >
        <Text color="text.secondary">No opened jobs waiting for an answer</Text>
      </Box>
    );
  }

  const handleActuallyApplied = async (matchId: string) => {
    if (busyId) return;
    setBusyId(matchId);
    setRowError(null);
    try {
      const result = await markMatchApplied(matchId, true);
      if (result?.error) {
        setRowError({ id: matchId, message: "Couldn't save your answer. Please try again." });
        return;
      }
      trackEvent("match_applied");
      onApplied(matchId);
    } catch {
      setRowError({ id: matchId, message: "Couldn't save your answer. Please try again." });
    } finally {
      setBusyId(null);
    }
  };

  const closeSkipModal = () => {
    setSkipTarget(null);
    setSelectedReason(null);
    setReasonDetails("");
    setSkipError(null);
  };

  const handleSkipSubmit = async () => {
    if (!skipTarget || !selectedReason || busyId) return;
    if (selectedReason === "other" && !reasonDetails.trim()) return;
    const matchId = skipTarget._id;
    setBusyId(matchId);
    setSkipError(null);
    try {
      const result = await markMatchAsSkipped(
        matchId,
        selectedReason,
        reasonDetails.trim() || undefined
      );
      if (result && "error" in result) {
        setSkipError(typeof result.error === "string" ? result.error : "Failed to skip. Try again.");
        return;
      }
      trackEvent("match_skipped", { reason: selectedReason });
      closeSkipModal();
      onSkipped(matchId, result?.signal ?? null);
    } catch {
      setSkipError("Failed to skip. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {rows.map((entry) => (
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
          <Text fontSize="sm" color="text.secondary" noOfLines={1}>
            {entry.job?.company ?? "Unknown company"}
          </Text>
          <Text fontSize="sm" color="text.tertiary" mb={2}>
            Match score {entry.matchScore}
          </Text>
          {entry.applied === false && (
            <Text fontSize="sm" color="text.tertiary" mb={3}>
              Didn&apos;t apply:{" "}
              {entry.notAppliedReason?.category
                ? REASON_LABELS[entry.notAppliedReason.category] ??
                  entry.notAppliedReason.category
                : "No reason given"}
            </Text>
          )}
          {rowError?.id === entry._id && (
            <Text role="alert" fontSize="sm" color="red.500" mb={2}>
              {rowError.message}
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
            <Button size="sm" variant="outline" onClick={() => onOpenDrawer(entry)}>
              Answer / write answers
            </Button>
            {entry.applied === false && (
              <Button
                size="sm"
                variant="ghost"
                colorScheme="green"
                isLoading={busyId === entry._id}
                isDisabled={busyId !== null}
                onClick={() => handleActuallyApplied(entry._id)}
              >
                Actually, I applied
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              isDisabled={busyId !== null}
              onClick={() => setSkipTarget(entry)}
            >
              Not for me
            </Button>
          </Box>
        </Box>
      ))}

      <Modal
        isOpen={skipTarget !== null}
        onClose={closeSkipModal}
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
              {Object.keys(REASON_LABELS).map((category) => (
                <WrapItem key={category}>
                  <Button
                    size={{ base: "md", sm: "sm" }}
                    variant={selectedReason === category ? "solid" : "outline"}
                    colorScheme={selectedReason === category ? "blue" : "gray"}
                    onClick={() => setSelectedReason(category)}
                  >
                    {REASON_LABELS[category]}
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
            <Button variant="ghost" mr={3} onClick={closeSkipModal}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleSkipSubmit}
              isLoading={busyId !== null && busyId === skipTarget?._id}
              isDisabled={
                !selectedReason ||
                (selectedReason === "other" && !reasonDetails.trim())
              }
            >
              Skip this job
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
