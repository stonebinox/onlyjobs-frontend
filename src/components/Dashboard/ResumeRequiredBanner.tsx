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
import { FiUpload } from "react-icons/fi";
import { Resume } from "@/types/Resume";
import { hasMeaningfulResume } from "@/utils/resumePredicate";

interface ResumeRequiredBannerProps {
  resume: Resume | null;
  onUploadClick: () => void;
}

export const ResumeRequiredBanner = ({
  resume,
  onUploadClick,
}: ResumeRequiredBannerProps) => {
  if (hasMeaningfulResume(resume)) {
    return null;
  }

  return (
    <Alert
      status="warning"
      borderRadius="md"
      mb={4}
      flexDirection={{ base: "column", md: "row" }}
      alignItems={{ base: "flex-start", md: "center" }}
    >
      <AlertIcon />
      <Box flex="1">
        <AlertTitle>Add Your Resume</AlertTitle>
        <AlertDescription>
          <Text>
            Upload your CV to start receiving personalized job matches.{" "}
            <Text as="span" fontWeight="medium">
              Without a resume, we can&apos;t match you with relevant opportunities.
            </Text>
          </Text>
        </AlertDescription>
      </Box>
      <HStack mt={{ base: 3, md: 0 }} ml={{ base: 0, md: 4 }}>
        <Button
          leftIcon={<FiUpload />}
          colorScheme="orange"
          size="sm"
          onClick={onUploadClick}
        >
          Upload CV
        </Button>
      </HStack>
    </Alert>
  );
};

