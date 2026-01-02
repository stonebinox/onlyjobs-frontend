import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Button,
  HStack,
  Text,
} from "@chakra-ui/react";
import { FiMessageSquare } from "react-icons/fi";
import { Resume } from "@/types/Resume";

interface NoQnABannerProps {
  answeredQuestionsCount?: number;
  resume: Resume | null;
  onStartQnA: () => void;
}

/**
 * Check if resume has meaningful data
 */
const hasValidResume = (resume: Resume | null): boolean => {
  if (!resume) return false;
  return !!(
    resume.summary ||
    (resume.skills && resume.skills.length > 0) ||
    (resume.experience && resume.experience.length > 0) ||
    (resume.education && resume.education.length > 0)
  );
};

export const NoQnABanner = ({
  answeredQuestionsCount = 0,
  resume,
  onStartQnA,
}: NoQnABannerProps) => {
  // Don't show banner if user has answered questions
  // Also don't show if they have a valid resume (QnARecommendationBanner handles that case)
  if (answeredQuestionsCount > 0 || hasValidResume(resume)) {
    return null;
  }

  return (
    <Alert
      status="info"
      borderRadius="md"
      mb={4}
      flexDirection={{ base: "column", md: "row" }}
      alignItems={{ base: "flex-start", md: "center" }}
    >
      <AlertIcon />
      <Box flex="1">
        <AlertTitle>Improve Your Job Matching Odds</AlertTitle>
        <AlertDescription>
          <Text>
            Answer a handful of questions to improve your chances of getting better job matches.{" "}
            <Text as="span" fontWeight="medium">
              Q&amp;A helps us understand your preferences and find more relevant opportunities for you.
            </Text>
          </Text>
        </AlertDescription>
      </Box>
      <HStack mt={{ base: 3, md: 0 }} ml={{ base: 0, md: 4 }}>
        <Button
          leftIcon={<FiMessageSquare />}
          colorScheme="blue"
          size="sm"
          onClick={onStartQnA}
        >
          Start Q&amp;A
        </Button>
      </HStack>
    </Alert>
  );
};

