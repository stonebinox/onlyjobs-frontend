import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Flex,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

import { createApiClient } from "@/lib/apiClient";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

const VERIFY_TIMEOUT_MS = 15_000;

const VerifyEmailPage = () => {
  const router = useRouter();
  const { verifyEmailChange, verifyInitialEmail } = createApiClient();
  const [status, setStatus] = useState<"loading" | "pending" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string>("");
  const [isEmailChange, setIsEmailChange] = useState<boolean>(false);
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const bgColor = useColorModeValue("gray.50", "gray.900");

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing from the URL.");
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

    const TIMEOUT_MSG =
      "Verification timed out — the link may be invalid or the server is slow. Please try again or request a new verification link.";

    const doVerify = async () => {
      setStatus("pending");
      setMessage("Verifying your email...");

      try {
        const initialResponse = await verifyInitialEmail(token, controller.signal);

        if (controller.signal.aborted) {
          clearTimeout(timeoutId);
          setStatus("error");
          setMessage(TIMEOUT_MSG);
          return;
        }

        if (!initialResponse.error) {
          clearTimeout(timeoutId);
          setStatus("success");
          setMessage("Your email has been verified successfully! You can now receive job matches.");
          setIsEmailChange(false);
          return;
        }

        const changeResponse = await verifyEmailChange(token, controller.signal);
        clearTimeout(timeoutId);

        if (controller.signal.aborted) {
          setStatus("error");
          setMessage(TIMEOUT_MSG);
          return;
        }

        if (changeResponse.error) {
          setStatus("error");
          setMessage(changeResponse.error);
        } else {
          setStatus("success");
          setMessage("Your email has been updated successfully. Please sign in with your new email.");
          setIsEmailChange(true);
        }
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        void err;
        setStatus("error");
        setMessage("An unexpected error occurred during verification. Please try again or request a new verification link.");
      }
    };

    doVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoToLogin = () => {
    router.push("/");
  };

  return (
    <>
      <SEO
        title="Verify Email"
        description="Verify your email address for OnlyJobs"
        noindex
      />
      <Box minH="100vh" bg={bgColor}>
      {/* Simple header */}
      <Box
        bg={useColorModeValue("brand.900", "brand.900")}
        px={4}
        color="white"
      >
        <Container maxW="container.xl">
          <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
            <HStack spacing={2}>
              <Heading size="md">OnlyJobs</Heading>
              <Badge colorScheme="orange" fontSize="0.7em" px={2} py={0.5}>
                BETA
              </Badge>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main content */}
      <Container maxW="container.sm" py={20}>
        <VStack spacing={6} align="center" justify="center">
          <Card bg={cardBg} shadow="md" w="100%">
            <CardBody py={8} px={6}>
              <VStack spacing={5} align="center" textAlign="center">
                <Heading size="md">
                  {isEmailChange ? "Email Change Verification" : "Email Verification"}
                </Heading>

                {status === "loading" && (
                  <>
                    <Spinner size="lg" color="blue.500" />
                    <Text color={textColor}>Loading...</Text>
                  </>
                )}

                {status === "pending" && (
                  <>
                    <Spinner size="lg" color="blue.500" />
                    <Text color={textColor}>{message}</Text>
                  </>
                )}

                {status === "success" && (
                  <>
                    <Box color="green.500">
                      <FiCheckCircle size={48} />
                    </Box>
                    <Text color={textColor}>{message}</Text>
                    <Button colorScheme="blue" onClick={handleGoToLogin}>
                      {isEmailChange ? "Sign In with New Email" : "Go to Login"}
                    </Button>
                  </>
                )}

                {status === "error" && (
                  <>
                    <Box color="red.500">
                      <FiXCircle size={48} />
                    </Box>
                    <Text color={textColor}>{message}</Text>
                    <Text fontSize="sm" color="gray.500">
                      The link may have expired or already been used. You can request a new verification email from your dashboard after signing in.
                    </Text>
                    <Button colorScheme="blue" onClick={handleGoToLogin}>
                      Go to Login
                    </Button>
                  </>
                )}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>

        <Footer />
      </Box>
    </>
  );
};

export default VerifyEmailPage;
