import {
  Box,
  Heading,
  HStack,
  Text,
  VStack,
  Button,
  Icon,
} from "@chakra-ui/react";
import { FiCheck, FiCircle } from "react-icons/fi";
import { User } from "@/types/User";

interface ChecklistItem {
  label: string;
  done: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

interface GettingStartedChecklistProps {
  user: User;
  walletBalance: number | null;
  onUploadCV: () => void;
  onStartQnA: () => void;
}

export const GettingStartedChecklist = ({
  user,
  walletBalance,
  onUploadCV,
  onStartQnA,
}: GettingStartedChecklistProps) => {
  const qnaCount = user.answeredQuestionsCount ?? 0;
  const QNA_TARGET = 5;

  const items: ChecklistItem[] = [
    {
      label: "Verify your email address",
      done: !!user.isVerified,
    },
    {
      label: "Upload your CV",
      done: !!user.resume,
      actionLabel: "Upload",
      onAction: onUploadCV,
    },
    {
      label: `Answer profile questions (${Math.min(qnaCount, QNA_TARGET)}/${QNA_TARGET} answered)`,
      done: qnaCount >= QNA_TARGET,
      actionLabel: "Start Q&A",
      onAction: onStartQnA,
    },
    {
      label: "Add wallet credit to enable daily matching",
      done: walletBalance !== null && walletBalance > 0,
      actionLabel: "Add credit",
      onAction: () => { window.location.href = "/wallet"; },
    },
  ];

  const allDone = items.every((item) => item.done);
  if (allDone) return null;

  const completedCount = items.filter((item) => item.done).length;

  return (
    <Box
      mb={4}
      p={5}
      borderRadius="2xl"
      bg="surface.card"
      border="1px solid"
      borderColor="surface.border"
    >
      <HStack justify="space-between" mb={4}>
        <Heading size="sm" color="text.primary">
          Getting started
        </Heading>
        <Text fontSize="xs" color="text.tertiary" fontWeight="medium">
          {completedCount}/{items.length} complete
        </Text>
      </HStack>
      <VStack align="stretch" spacing={3}>
        {items.map((item) => (
          <HStack key={item.label} spacing={3} justify="space-between">
            <HStack spacing={3}>
              <Icon
                as={item.done ? FiCheck : FiCircle}
                color={item.done ? "green.500" : "text.tertiary"}
                boxSize={4}
                flexShrink={0}
              />
              <Text
                fontSize="sm"
                color={item.done ? "text.tertiary" : "text.primary"}
                textDecoration={item.done ? "line-through" : "none"}
              >
                {item.label}
              </Text>
            </HStack>
            {!item.done && item.actionLabel && item.onAction && (
              <Button
                size="xs"
                variant="outline"
                colorScheme="purple"
                borderRadius="lg"
                onClick={item.onAction}
                flexShrink={0}
              >
                {item.actionLabel}
              </Button>
            )}
          </HStack>
        ))}
      </VStack>
    </Box>
  );
};
