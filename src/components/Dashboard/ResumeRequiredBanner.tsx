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
import NextLink from "next/link";
import { FiUpload } from "react-icons/fi";

interface ResumeRequiredBannerProps {
  onUploadClick: () => void;
  isUploading?: boolean;
}

export const ResumeRequiredBanner = ({
  onUploadClick,
  isUploading = false,
}: ResumeRequiredBannerProps) => {
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
        <AlertTitle>You have not added a CV yet</AlertTitle>
        <AlertDescription>
          <Text>Upload one so we can match you to jobs.</Text>
          <NextLink href="/onboarding">
            <Text
              as="span"
              fontSize="sm"
              cursor="pointer"
              _hover={{ textDecoration: "underline" }}
            >
              or complete guided onboarding
            </Text>
          </NextLink>
        </AlertDescription>
      </Box>
      <HStack mt={{ base: 3, md: 0 }} ml={{ base: 0, md: 4 }}>
        <Button
          leftIcon={<FiUpload />}
          colorScheme="orange"
          size="sm"
          onClick={onUploadClick}
          isLoading={isUploading}
          loadingText="Uploading..."
        >
          Upload CV (PDF or DOCX)
        </Button>
      </HStack>
    </Alert>
  );
};
