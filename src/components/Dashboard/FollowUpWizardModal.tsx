import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Wrap,
  WrapItem,
  Alert,
  AlertIcon,
  Flex,
} from "@chakra-ui/react";

export const OUTCOME_OPTIONS = {
  heard_back: { label: "Heard Back", color: "blue" },
  interview: { label: "Got Interview", color: "green" },
  offer: { label: "Got Offer", color: "green" },
  rejected: { label: "Rejected", color: "red" },
  no_response: { label: "No Response", color: "gray" },
} as const;

export type OutcomeKey = keyof typeof OUTCOME_OPTIONS;

interface FollowUpWizardModalProps {
  isOpen: boolean;
  currentJob: { matchId: string; title: string; company: string } | null;
  step: number;
  total: number;
  isSubmitting: boolean;
  error: string | null;
  onSelectOutcome: (outcome: OutcomeKey) => void;
  onSkip: () => void;
  onClose: () => void;
}

export const FollowUpWizardModal = ({
  isOpen,
  currentJob,
  step,
  total,
  isSubmitting,
  error,
  onSelectOutcome,
  onSkip,
  onClose,
}: FollowUpWizardModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", sm: "md" }}
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent mx={{ base: 0, sm: 4 }} my={{ base: 0, sm: "auto" }}>
        <ModalHeader fontSize={{ base: "lg", sm: "md" }}>
          Did you hear back from {currentJob?.company ?? "this company"}?
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={4}>
          {currentJob && (
            <Text fontSize="sm" color="gray.500" mb={4}>
              {currentJob.title}
            </Text>
          )}
          {error && (
            <Alert status="error" mb={4} borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          <Wrap spacing={2}>
            {(Object.keys(OUTCOME_OPTIONS) as OutcomeKey[]).map((key) => (
              <WrapItem key={key}>
                <Button
                  size={{ base: "md", sm: "sm" }}
                  variant="outline"
                  colorScheme={OUTCOME_OPTIONS[key].color}
                  onClick={() => onSelectOutcome(key)}
                  isDisabled={isSubmitting}
                >
                  {OUTCOME_OPTIONS[key].label}
                </Button>
              </WrapItem>
            ))}
          </Wrap>
        </ModalBody>
        <ModalFooter justifyContent="space-between">
          <Text fontSize="sm" color="gray.500">
            {step} of {total}
          </Text>
          <Flex gap={2}>
            <Button
              variant="ghost"
              size={{ base: "md", sm: "sm" }}
              onClick={onSkip}
              isDisabled={isSubmitting}
            >
              Skip
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
