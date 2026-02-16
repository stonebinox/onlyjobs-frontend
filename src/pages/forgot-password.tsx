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
} from "@chakra-ui/react";
import styled from "styled-components";
import Link from "next/link";

import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

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
  gap: 20px;
`;

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { requestPasswordReset } = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (email.trim() === "") {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const response = await requestPasswordReset(email.trim());

      if (response.error) {
        throw new Error(response.error);
      }

      setSubmitted(true);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Forgot Password"
        description="Reset your OnlyJobs password"
        noindex
      />
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
        <Flex
          justify="center"
          align="center"
          minH="400px"
        >
          {submitted ? (
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
                  Check your email
                </AlertTitle>
                <AlertDescription maxWidth="sm">
                  If an account with that email exists, you will receive a password reset link shortly. 
                  Please check your inbox and spam folder.
                </AlertDescription>
              </Alert>
              <Link href="/">
                <Button variant="outline">Back to Login</Button>
              </Link>
            </VStack>
          ) : (
            <form onSubmit={handleSubmit}>
              <FormContainer>
                <Heading size="md" textAlign="center">
                  Forgot Password
                </Heading>
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </Text>
                
                {error && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}

                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  isInvalid={!!error}
                />
                <Button
                  type="submit"
                  variant="solid"
                  width="100%"
                  isDisabled={loading}
                  isLoading={loading}
                  loadingText="Sending..."
                >
                  Send Reset Link
                </Button>
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
              </FormContainer>
            </form>
          )}
        </Flex>
        </Container>
        <Footer />
      </Box>
    </>
  );
}

