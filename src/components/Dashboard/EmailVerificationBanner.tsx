import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Button,
  HStack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiMail } from "react-icons/fi";
import { useApi } from "@/hooks/useApi";

interface EmailVerificationBannerProps {
  isVerified: boolean;
  email?: string;
  onVerificationSent?: () => void;
}

export const EmailVerificationBanner = ({
  isVerified,
  email,
  onVerificationSent,
}: EmailVerificationBannerProps) => {
  const { resendVerificationEmail } = useApi();
  const [isResending, setIsResending] = useState(false);
  const toast = useToast();

  // Don't show banner if user is verified
  if (isVerified) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);
    try {
      const response = await resendVerificationEmail();
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Verification email sent",
          description: "Please check your inbox for the verification link.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        if (onVerificationSent) {
          onVerificationSent();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsResending(false);
    }
  };

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
        <AlertTitle>Verify Your Email Address</AlertTitle>
        <AlertDescription>
          <Text>
            Please verify your email address to start receiving job matches.{" "}
            {email && (
              <Text as="span" fontWeight="medium">
                Check your inbox at {email} for a verification link.
              </Text>
            )}
            {!email && (
              <Text as="span">
                Check your inbox for a verification link.
              </Text>
            )}
          </Text>
        </AlertDescription>
      </Box>
      <HStack mt={{ base: 3, md: 0 }} ml={{ base: 0, md: 4 }}>
        <Button
          leftIcon={<FiMail />}
          colorScheme="orange"
          size="sm"
          onClick={handleResend}
          isLoading={isResending}
          loadingText="Sending..."
        >
          Resend Link
        </Button>
      </HStack>
    </Alert>
  );
};

