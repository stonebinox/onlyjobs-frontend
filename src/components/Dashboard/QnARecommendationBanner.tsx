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

interface QnARecommendationBannerProps {
  answeredQuestionsCount: number;
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

export const QnARecommendationBanner = ({
  answeredQuestionsCount,
  resume,
  onStartQnA,
}: QnARecommendationBannerProps) => {
  // Don't show banner if user has answered questions OR has no resume
  // (Resume banner takes priority if they don't have one)
  if (answeredQuestionsCount > 0 || !hasValidResume(resume)) {
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
        <AlertTitle>Improve Your Job Matches</AlertTitle>
        <AlertDescription>
          <Text>
            Answer a few questions to help us find better job matches for you.{" "}
            <Text as="span" fontWeight="medium">
              Q&amp;A helps us understand your preferences beyond your resume.
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

