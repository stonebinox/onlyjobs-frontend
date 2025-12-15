import {
  Alert,
  AlertIcon,
  Box,
  Button,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";

import { useApi } from "@/hooks/useApi";
import { JobResult } from "@/types/JobResult";

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
  const [submittingButton, setSubmittingButton] = useState<'yes' | 'no' | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const { markMatchApplied } = useApi();

  // Don't show banner if no job result, if already answered, or if user just answered
  if (!jobResult || jobResult.applied !== null || hasAnswered) {
    return null;
  }

  const handleAnswer = async (applied: boolean) => {
    setSubmittingButton(applied ? 'yes' : 'no');
    try {
      const response = await markMatchApplied(jobResult._id, applied);
      if (!response.error) {
        // Hide banner immediately
        setHasAnswered(true);
        // Update the local jobResult
        if (jobResult) {
          jobResult.applied = applied;
        }
        // Call callback if provided to refresh parent state
        if (onStatusUpdate) {
          onStatusUpdate();
        }
        // Close the drawer after a short delay to allow the user to see the success
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

  const jobTitle = jobResult.job?.title || "this job";
  const companyName = jobResult.job?.company || "this company";

  return (
    <Alert status="info" borderRadius="md" mb={4}>
      <AlertIcon />
      <VStack align="stretch" spacing={3} width="100%">
        <Box>
          <Text fontWeight="semibold" fontSize="md">
            Did you apply to {jobTitle} at {companyName}?
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button
            colorScheme="green"
            size="sm"
            onClick={() => handleAnswer(true)}
            isLoading={submittingButton === 'yes'}
            loadingText="Saving..."
            isDisabled={submittingButton !== null}
          >
            Yes
          </Button>
          <Button
            colorScheme="red"
            variant="outline"
            size="sm"
            onClick={() => handleAnswer(false)}
            isLoading={submittingButton === 'no'}
            loadingText="Saving..."
            isDisabled={submittingButton !== null}
          >
            No
          </Button>
        </HStack>
      </VStack>
    </Alert>
  );
};

