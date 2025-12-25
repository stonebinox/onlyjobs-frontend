import {
  Box,
  Button,
  Divider,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  VStack,
  useDisclosure,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useState } from "react";

import { useApi } from "@/hooks/useApi";
import { JobResult } from "@/types/JobResult";

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

interface ApplicationStatusBannerProps {
  jobResult: JobResult | null;
  onStatusUpdate?: () => void;
  onClose?: () => void;
}

export const ApplicationStatusBanner = ({
  jobResult,
  onStatusUpdate,
  onClose,
}: ApplicationStatusBannerProps) => {
  const [submittingButton, setSubmittingButton] = useState<"yes" | "no" | null>(
    null
  );
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ReasonCategory | null>(
    null
  );
  const [reasonDetails, setReasonDetails] = useState("");
  const { markMatchApplied } = useApi();
  const {
    isOpen: isReasonModalOpen,
    onOpen: openReasonModal,
    onClose: closeReasonModal,
  } = useDisclosure();

  // Don't show banner if no job result, if already answered, or if user just answered
  if (!jobResult || jobResult.applied !== null || hasAnswered) {
    return null;
  }

  const handleYesClick = async () => {
    setSubmittingButton("yes");
    try {
      const response = await markMatchApplied(jobResult._id, true);
      if (!response.error) {
        setHasAnswered(true);
        if (jobResult) {
          jobResult.applied = true;
        }
        if (onStatusUpdate) {
          onStatusUpdate();
        }
        if (onClose) {
          setTimeout(() => {
            onClose();
          }, 300);
        }
      }
    } catch (error) {
      console.error("Error updating applied status:", error);
    } finally {
      setSubmittingButton(null);
    }
  };

  const handleNoClick = () => {
    // Open the reason picker modal
    openReasonModal();
  };

  const handleReasonSubmit = async () => {
    if (!selectedReason) return;

    setSubmittingButton("no");
    try {
      const response = await markMatchApplied(
        jobResult._id,
        false,
        selectedReason,
        reasonDetails.trim() || undefined
      );
      if (!response.error) {
        setHasAnswered(true);
        if (jobResult) {
          jobResult.applied = false;
        }
        closeReasonModal();
        if (onStatusUpdate) {
          onStatusUpdate();
        }
        if (onClose) {
          setTimeout(() => {
            onClose();
          }, 300);
        }
      }
    } catch (error) {
      console.error("Error updating applied status:", error);
    } finally {
      setSubmittingButton(null);
    }
  };

  const handleModalClose = () => {
    setSelectedReason(null);
    setReasonDetails("");
    closeReasonModal();
  };

  const jobTitle = jobResult.job?.title || "this job";
  const companyName = jobResult.job?.company || "this company";

  return (
    <>
      <Box mt={6} pt={6}>
        <Divider mb={6} />
        <VStack align="stretch" spacing={4} width="100%">
          <Text fontWeight="medium" fontSize="sm" color="gray.700">
            Did you apply to {jobTitle} at {companyName}?
          </Text>
          <HStack spacing={3}>
            <Button
              colorScheme="green"
              size="sm"
              onClick={handleYesClick}
              isLoading={submittingButton === "yes"}
              loadingText="Saving..."
              isDisabled={submittingButton !== null}
            >
              Yes
            </Button>
            <Button
              colorScheme="red"
              variant="outline"
              size="sm"
              onClick={handleNoClick}
              isDisabled={submittingButton !== null}
            >
              No
            </Button>
          </HStack>
        </VStack>
      </Box>

      {/* Reason Picker Modal */}
      <Modal isOpen={isReasonModalOpen} onClose={handleModalClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="md">Why didn&apos;t you apply?</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <Text fontSize="sm" color="gray.600" mb={4}>
              Help us improve your matches by telling us why this job
              wasn&apos;t right for you.
            </Text>
            <Wrap spacing={2}>
              {(Object.keys(REASON_CATEGORIES) as ReasonCategory[]).map(
                (category) => (
                  <WrapItem key={category}>
                    <Button
                      size="sm"
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

            {/* Show details textarea for any selection (optional for all) */}
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
            <Button variant="ghost" mr={3} onClick={handleModalClose} size="sm">
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleReasonSubmit}
              isDisabled={!selectedReason}
              isLoading={submittingButton === "no"}
              loadingText="Submitting..."
              size="sm"
            >
              Submit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
