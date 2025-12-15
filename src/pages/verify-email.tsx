import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Button,
  Card,
  CardBody,
  Heading,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";

import DashboardLayout from "../components/Layout/DashboardLayout";
import { useApi } from "@/hooks/useApi";

const VerifyEmailPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const { verifyEmailChange } = useApi();
  const [status, setStatus] = useState<"pending" | "success" | "error">(
    "pending"
  );
  const [message, setMessage] = useState<string>(
    "Verifying your email change..."
  );
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.700", "gray.200");

  useEffect(() => {
    const doVerify = async () => {
      if (!token || typeof token !== "string") {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }
      const response = await verifyEmailChange(token);
      if (response.error) {
        setStatus("error");
        setMessage(response.error);
      } else {
        setStatus("success");
        setMessage("Your email has been updated. Please sign in again.");
      }
    };
    doVerify();
  }, [token, verifyEmailChange]);

  const handleGoToSignIn = () => {
    router.push("/signin");
  };

  return (
    <DashboardLayout>
      <VStack spacing={6} align="center" justify="center">
        <Card bg={cardBg} shadow="md" maxW="lg" w="100%">
          <CardBody>
            <VStack spacing={4} align="center" textAlign="center">
              <Heading size="md">Verify Email Change</Heading>
              {status === "pending" && <Spinner size="lg" />}
              <Text color={textColor}>{message}</Text>
              {status !== "pending" && (
                <Button colorScheme="blue" onClick={handleGoToSignIn}>
                  Go to Sign In
                </Button>
              )}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </DashboardLayout>
  );
};

export default VerifyEmailPage;
