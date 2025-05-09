import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  Input,
  VStack,
  Text,
  useColorModeValue,
  Card,
  CardBody,
  useToast,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Skeleton,
} from "@chakra-ui/react";
import { FaRedo, FaSave, FaSkull } from "react-icons/fa";

import DashboardLayout from "../components/Layout/DashboardLayout";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/User";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

const SettingsPage = () => {
  // State for form fields
  const [email, setEmail] = useState<string>("user@example.com");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [matchScore, setMatchScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
  const [scoreLoading, setScoreLoading] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const {
    updateUserEmail,
    getUserProfile,
    updatePassword,
    updateMinMatchScore,
    factoryResetUserAccount,
    deleteUserAccount,
  } = useApi();
  const auth = useAuth();
  const router = useRouter();

  // Modal controls
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const {
    isOpen: isResetOpen,
    onOpen: onResetOpen,
    onClose: onResetClose,
  } = useDisclosure();

  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");

  const handleUpdateAccount = async (e: React.FormEvent) => {
    if (!user) return;

    if (
      currentPassword === "" ||
      newPassword === "" ||
      confirmPassword === "" ||
      newPassword !== confirmPassword
    ) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        status: "error",
        duration: 3000,
        isClosable: true,
      });

      return;
    }

    try {
      setPasswordLoading(true);
      const response = await updatePassword(currentPassword, newPassword);

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error("Error updating account:", error);
      toast({
        title: "Error updating account",
        description:
          error.message || "There was an error updating your account",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setPasswordLoading(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleUpdatePreferences = async () => {
    if (!user || user.preferences?.minScore === matchScore) return;

    try {
      setScoreLoading(true);
      const response = await updateMinMatchScore(matchScore);
      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Preferences updated",
        description: `Match score preference set to ${matchScore}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast({
        title: "Error updating preferences",
        description: "There was an error updating your preferences",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setScoreLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await deleteUserAccount();

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      auth.logout();
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error deleting account",
        description: "There was an error deleting your account",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      onDeleteClose();
    }
  };

  const handleFactoryReset = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await factoryResetUserAccount();

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Data reset",
        description: "Your data has been reset successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error resetting data:", error);
      toast({
        title: "Error resetting data",
        description: "There was an error resetting your data",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      onResetClose();
    }
  };

  const labelStyles = {
    mt: "2",
    ml: "-2.5",
    fontSize: "sm",
  };

  const handleEmailUpdate = async () => {
    if (!user || user.email === email.trim()) return;

    try {
      setLoading(true);
      await updateUserEmail(email.trim());
      await fetchUserProfile();

      toast({
        title: "Email updated",
        description: "Your email address has been updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating email:", error);
      toast({
        title: "Error updating email",
        description: "There was an error updating your email address",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await getUserProfile();
      setUser(response);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleUpdatePreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchScore]);

  useEffect(() => {
    if (!user) return;

    setEmail(user.email);
    setMatchScore(user.preferences?.minScore || 0);
  }, [user]);

  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout>
      <VStack spacing={6} align="stretch">
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Heading as="h2" size="md" mb={4}>
              Account Settings
            </Heading>
            <form>
              <VStack spacing={4} align="stretch">
                <Skeleton isLoaded={!loading}>
                  <FormControl id="email">
                    <FormLabel>Email address</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={handleEmailUpdate}
                    />
                  </FormControl>
                </Skeleton>
                <Divider />
                <Heading as="h3" size="sm" mb={2}>
                  Change Password
                </Heading>
                <FormControl id="currentPassword">
                  <FormLabel>Current Password</FormLabel>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={passwordLoading}
                  />
                </FormControl>
                <FormControl id="newPassword">
                  <FormLabel>New Password</FormLabel>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={passwordLoading}
                  />
                </FormControl>
                <FormControl id="confirmPassword">
                  <FormLabel>Confirm New Password</FormLabel>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={passwordLoading}
                  />
                </FormControl>
                <Button
                  type="button"
                  colorScheme="blue"
                  alignSelf="flex-end"
                  onClick={handleUpdateAccount}
                  disabled={passwordLoading}
                  leftIcon={<FaSave />}
                >
                  Save Changes
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>

        {/* Match Preferences */}
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Heading as="h2" size="md" mb={4}>
              Match Preferences
            </Heading>
            <VStack spacing={6} align="stretch">
              <FormControl id="matchScore">
                <FormLabel>Minimum Match Score</FormLabel>
                <Text color={textColor} mb={2}>
                  Only show job opportunities with at least this match
                  percentage
                </Text>
                <Box pt={6} pb={2}>
                  <Slider
                    isDisabled={scoreLoading}
                    aria-label="match-score-slider"
                    defaultValue={matchScore}
                    min={30}
                    max={100}
                    step={5}
                    onChange={(val) => setMatchScore(val)}
                  >
                    <SliderMark value={30} {...labelStyles}>
                      30%
                    </SliderMark>
                    <SliderMark value={50} {...labelStyles}>
                      50%
                    </SliderMark>
                    <SliderMark value={70} {...labelStyles}>
                      70%
                    </SliderMark>
                    <SliderMark value={90} {...labelStyles}>
                      90%
                    </SliderMark>
                    <SliderMark
                      value={matchScore}
                      textAlign="center"
                      bg="blue.500"
                      color="white"
                      mt="-10"
                      ml="-5"
                      w="12"
                      borderRadius="md"
                    >
                      {matchScore}%
                    </SliderMark>
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </Box>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Data Reset */}
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Heading as="h2" size="md" mb={4}>
              Data Reset
            </Heading>
            <Alert status="warning" borderRadius="md" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>Factory Reset</AlertTitle>
                <AlertDescription>
                  This will clear all your CV data, preferences, and Q&A
                  responses, but will not delete your account.
                </AlertDescription>
              </Box>
            </Alert>
            <Button
              colorScheme="orange"
              onClick={onResetOpen}
              leftIcon={<FaRedo />}
            >
              Factory Reset
            </Button>
          </CardBody>
        </Card>

        {/* Account Deletion */}
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Heading as="h2" size="md" mb={4}>
              Delete Account
            </Heading>
            <Alert status="error" borderRadius="md" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Deleting your account is permanent and cannot be undone. All
                  your data will be permanently removed.
                </AlertDescription>
              </Box>
            </Alert>
            <Button
              colorScheme="red"
              onClick={onDeleteOpen}
              leftIcon={<FaSkull />}
            >
              Delete My Account
            </Button>
          </CardBody>
        </Card>
      </VStack>

      {/* Delete Account Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Account Deletion</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to delete your account? This action cannot
              be undone and you will lose all your data.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDeleteAccount}>
              Yes, Delete My Account
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Factory Reset Confirmation Modal */}
      <Modal isOpen={isResetOpen} onClose={onResetClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Factory Reset</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to reset all your data? This will clear your
              CV information, preferences, and all Q&A responses.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={onResetClose}>
              Cancel
            </Button>
            <Button colorScheme="orange" onClick={handleFactoryReset}>
              Yes, Reset My Data
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
};

export default SettingsPage;
