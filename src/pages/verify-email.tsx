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
  const { verifyEmailChange, verifyInitialEmail } = useApi();
  const [status, setStatus] = useState<"pending" | "success" | "error">(
    "pending"
  );
  const [message, setMessage] = useState<string>(
    "Verifying your email..."
  );
  const [isEmailChange, setIsEmailChange] = useState<boolean>(false);
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.700", "gray.200");

  useEffect(() => {
    const doVerify = async () => {
      if (!token || typeof token !== "string") {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }
      
      // Try initial verification first
      const initialResponse = await verifyInitialEmail(token);
      if (!initialResponse.error) {
        setStatus("success");
        setMessage("Your email has been verified successfully!");
        setIsEmailChange(false);
        return;
      }

      // If initial verification fails, try email change verification
      const changeResponse = await verifyEmailChange(token);
      if (changeResponse.error) {
        setStatus("error");
        setMessage(changeResponse.error);
      } else {
        setStatus("success");
        setMessage("Your email has been updated. Please sign in again.");
        setIsEmailChange(true);
      }
    };
    doVerify();
  }, [token, verifyEmailChange, verifyInitialEmail]);

  const handleGoToSignIn = () => {
    router.push("/signin");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <DashboardLayout>
      <VStack spacing={6} align="center" justify="center">
        <Card bg={cardBg} shadow="md" maxW="lg" w="100%">
          <CardBody>
            <VStack spacing={4} align="center" textAlign="center">
              <Heading size="md">
                {isEmailChange ? "Verify Email Change" : "Verify Email"}
              </Heading>
              {status === "pending" && <Spinner size="lg" />}
              <Text color={textColor}>{message}</Text>
              {status !== "pending" && (
                <Button
                  colorScheme="blue"
                  onClick={isEmailChange ? handleGoToSignIn : handleGoToDashboard}
                >
                  {isEmailChange ? "Go to Sign In" : "Go to Dashboard"}
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
