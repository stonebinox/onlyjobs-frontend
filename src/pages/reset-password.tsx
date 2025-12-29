import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Input,
  Badge,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  FormControl,
  FormLabel,
  FormErrorMessage,
} from "@chakra-ui/react";
import styled from "styled-components";
import Link from "next/link";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Footer } from "@/components/Footer";

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 420px;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const { resetPassword } = useApi();

  const validatePassword = () => {
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validatePassword()) {
      return;
    }

    if (!token || typeof token !== "string") {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword(token, newPassword);

      if (response.error) {
        throw new Error(response.error);
      }

      setSuccess(true);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Check for missing token
  const isMissingToken = router.isReady && !token;

  return (
    <Box>
      <Box
        bg={useColorModeValue("brand.900", "brand.900")}
        px={4}
        color="white"
      >
        <Container maxW="container.xl">
          <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
            <Link href="/">
              <HStack spacing={2} cursor="pointer">
                <Heading size="md">OnlyJobs</Heading>
                <Badge colorScheme="orange" fontSize="0.7em" px={2} py={0.5}>
                  BETA
                </Badge>
              </HStack>
            </Link>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" py={12} minH="calc(100vh - 200px)">
        <Flex justify="center" align="center" minH="400px">
          {success ? (
            <VStack spacing={6} maxW="400px" textAlign="center">
              <Alert
                status="success"
                variant="subtle"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                borderRadius="md"
                py={6}
              >
                <AlertIcon boxSize="40px" mr={0} />
                <AlertTitle mt={4} mb={1} fontSize="lg">
                  Password Reset Successful
                </AlertTitle>
                <AlertDescription maxWidth="sm">
                  Your password has been reset successfully. You can now log in
                  with your new password.
                </AlertDescription>
              </Alert>
              <Link href="/">
                <Button colorScheme="blue">Go to Login</Button>
              </Link>
            </VStack>
          ) : isMissingToken ? (
            <VStack spacing={6} maxW="400px" textAlign="center">
              <Alert
                status="error"
                variant="subtle"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                borderRadius="md"
                py={6}
              >
                <AlertIcon boxSize="40px" mr={0} />
                <AlertTitle mt={4} mb={1} fontSize="lg">
                  Invalid Reset Link
                </AlertTitle>
                <AlertDescription maxWidth="sm">
                  This password reset link is invalid or has expired. Please
                  request a new password reset.
                </AlertDescription>
              </Alert>
              <Link href="/forgot-password">
                <Button colorScheme="blue">Request New Reset Link</Button>
              </Link>
            </VStack>
          ) : (
            <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "420px" }}>
              <FormContainer>
                <VStack spacing={5} width="100%" align="stretch">
                  <VStack spacing={2} textAlign="center">
                    <Heading size="md">Reset Password</Heading>
                    <Text fontSize="sm" color="gray.500">
                      Enter your new password below.
                    </Text>
                  </VStack>

                  {error && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      {error}
                    </Alert>
                  )}

                  <FormControl isInvalid={!!passwordError}>
                    <FormLabel>New Password</FormLabel>
                    <Input
                      type="password"
                      placeholder="New password (min 8 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </FormControl>

                  <FormControl isInvalid={!!passwordError}>
                    <FormLabel>Confirm Password</FormLabel>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {passwordError && (
                      <FormErrorMessage>{passwordError}</FormErrorMessage>
                    )}
                  </FormControl>

                  <Button
                    type="submit"
                    variant="solid"
                    width="100%"
                    isDisabled={loading}
                    isLoading={loading}
                    loadingText="Resetting..."
                    mt={2}
                  >
                    Reset Password
                  </Button>
                  
                  <Box textAlign="center">
                    <Link href="/">
                      <Text
                        fontSize="sm"
                        color="brand.500"
                        cursor="pointer"
                        _hover={{ textDecoration: "underline" }}
                      >
                        Back to Login
                      </Text>
                    </Link>
                  </Box>
                </VStack>
              </FormContainer>
            </form>
          )}
        </Flex>
      </Container>
      <Footer />
    </Box>
  );
}

