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
  Switch,
  InputGroup,
  InputLeftElement,
  Icon as ChakraIcon,
} from "@chakra-ui/react";
import { FaRedo, FaSave, FaSkull } from "react-icons/fa";
import { FaEnvelope } from "react-icons/fa6";

import DashboardLayout from "../components/Layout/DashboardLayout";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/User";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import Guide from "@/components/Guide/Guide";
import { settingsGuideConfig } from "@/config/guides/settingsGuide";
import { useGuide } from "@/contexts/GuideContext";

const SettingsPage = () => {
  // State for form fields
  const [email, setEmail] = useState<string>("user@example.com");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [matchScore, setMatchScore] = useState<number>(0);
  const [jobTypes, setJobTypes] = useState<string>("");
  const [industries, setIndustries] = useState<string>("");
  const [locations, setLocations] = useState<string>("");
  const [remoteOnly, setRemoteOnly] = useState<boolean>(false);
  const [minSalary, setMinSalary] = useState<number>(0);
  const [newEmailInput, setNewEmailInput] = useState<string>("");
  const [emailChangeLoading, setEmailChangeLoading] = useState<boolean>(false);
  const [matchingEnabled, setMatchingEnabled] = useState<boolean>(true);
  const [pendingMatchingEnabled, setPendingMatchingEnabled] = useState<
    boolean | null
  >(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [prefSaving, setPrefSaving] = useState<boolean>(false);
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
  const [scoreLoading, setScoreLoading] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const {
    updateUserEmail,
    getUserProfile,
    updatePassword,
    updateMinMatchScore,
    updatePreferences,
    requestEmailChange,
    factoryResetUserAccount,
    deleteUserAccount,
    resetGuideProgress,
  } = useApi();
  const auth = useAuth();
  const router = useRouter();
  const { resetPageProgress, guideProgress } = useGuide();

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

  const {
    isOpen: isEmailChangeOpen,
    onOpen: onEmailChangeOpen,
    onClose: onEmailChangeClose,
  } = useDisclosure();

  const {
    isOpen: isMatchingConfirmOpen,
    onOpen: onMatchingConfirmOpen,
    onClose: onMatchingConfirmClose,
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

  const handleSavePreferences = async (overrideMatchingEnabled?: boolean) => {
    if (!user) return;

    const payload: Record<string, any> = {};

    const splitAndClean = (value: string) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    payload.jobTypes = splitAndClean(jobTypes);
    payload.industries = splitAndClean(industries);
    payload.location = splitAndClean(locations);
    payload.remoteOnly = remoteOnly;
    payload.minSalary = Number(minSalary) || 0;
    payload.matchingEnabled =
      overrideMatchingEnabled !== undefined
        ? overrideMatchingEnabled
        : matchingEnabled;

    try {
      setPrefSaving(true);
      const response = await updatePreferences(payload);
      if (response.error) {
        throw new Error(response.error);
      }
      const nextMatchingEnabled =
        overrideMatchingEnabled !== undefined
          ? overrideMatchingEnabled
          : matchingEnabled;
      setMatchingEnabled(nextMatchingEnabled);
      setUser((prev) => {
        if (!prev) return prev;
        const currentPrefs = prev.preferences || {
          jobTypes: [],
          location: [],
          remoteOnly: false,
          minSalary: 0,
          industries: [],
          minScore: 30,
          matchingEnabled: true,
        };
        return {
          ...prev,
          preferences: {
            jobTypes: payload.jobTypes ?? currentPrefs.jobTypes,
            location: payload.location ?? currentPrefs.location,
            remoteOnly: payload.remoteOnly ?? currentPrefs.remoteOnly,
            minSalary: payload.minSalary ?? currentPrefs.minSalary,
            industries: payload.industries ?? currentPrefs.industries,
            minScore: payload.minScore ?? currentPrefs.minScore,
            matchingEnabled:
              payload.matchingEnabled ?? currentPrefs.matchingEnabled,
          },
        };
      });
      toast({
        title: "Preferences updated",
        description: "Your job preferences have been saved",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error("Error updating preferences:", error);
      toast({
        title: "Error updating preferences",
        description: error.message || "There was an error saving preferences",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setPrefSaving(false);
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
    // legacy handler no-op; email change is handled via verified flow
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

  const handleEmailChangeRequest = async () => {
    if (
      !newEmailInput ||
      newEmailInput.trim().toLowerCase() === email.trim().toLowerCase()
    ) {
      toast({
        title: "Enter a different email",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setEmailChangeLoading(true);
      const response = await requestEmailChange(newEmailInput.trim());
      if (response.error) {
        throw new Error(response.error);
      }
      toast({
        title: "Verification sent",
        description:
          "Check your new email to confirm the change. You will need to sign in again.",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      onEmailChangeClose();
      auth.logout();
      router.push("/signin");
    } catch (error: any) {
      console.error("Email change request error:", error);
      toast({
        title: "Email change failed",
        description: error.message || "Could not request email change",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setEmailChangeLoading(false);
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
    setRemoteOnly(user.preferences?.remoteOnly || false);
    setMinSalary(user.preferences?.minSalary || 0);
    setJobTypes((user.preferences?.jobTypes || []).join(", "));
    setIndustries((user.preferences?.industries || []).join(", "));
    setLocations((user.preferences?.location || []).join(", "));
    setMatchingEnabled(user.preferences?.matchingEnabled ?? true);
  }, [user]);

  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResetGuide = async (pageId?: string) => {
    try {
      await resetGuideProgress(pageId);
      await resetPageProgress(pageId);
      toast({
        title: "Guide reset",
        description: pageId
          ? `Guide for ${pageId} has been reset`
          : "All guides have been reset",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error resetting guide:", error);
      toast({
        title: "Error",
        description: "Failed to reset guide",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <DashboardLayout>
      <Guide
        pageId={settingsGuideConfig.pageId}
        steps={settingsGuideConfig.steps}
        showModal={settingsGuideConfig.showModal}
        modalTitle={settingsGuideConfig.modalTitle}
        modalContent={settingsGuideConfig.modalContent}
      />
      <VStack spacing={6} align="stretch">
        <Card bg={cardBg} shadow="md" data-guide="email-settings">
          <CardBody>
            <Heading as="h2" size="md" mb={4}>
              Account Settings
            </Heading>
            <VStack spacing={4} align="stretch">
              <Skeleton isLoaded={!loading}>
                <FormControl id="email">
                  <FormLabel>Current Email</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    isReadOnly
                    cursor="not-allowed"
                  />
                </FormControl>
                <Button variant="outline" onClick={onEmailChangeOpen}>
                  Change Email
                </Button>
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
          </CardBody>
        </Card>

        {/* Match Preferences */}
        <Card bg={cardBg} shadow="md" data-guide="preferences-section">
          <CardBody>
            <Heading as="h2" size="md" mb={4}>
              Match Preferences
            </Heading>
            <VStack spacing={6} align="stretch">
              <FormControl id="matchScore" data-guide="match-score-setting">
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

              <Divider />

              <FormControl id="minSalary">
                <FormLabel>Minimum Salary (USD/year)</FormLabel>
                <Input
                  type="number"
                  value={minSalary}
                  onChange={(e) => setMinSalary(Number(e.target.value) || 0)}
                  min={0}
                  placeholder="e.g., 120000"
                />
              </FormControl>

              <FormControl id="remoteOnly" display="flex" alignItems="center">
                <FormLabel mb="0">Remote Only</FormLabel>
                <Switch
                  isChecked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  colorScheme="blue"
                />
              </FormControl>

              <FormControl
                id="matchingEnabled"
                display="flex"
                alignItems="center"
                data-guide="matching-toggle"
              >
                <FormLabel mb="0">
                  Match jobs for me (uses $0.30 when matches are found)
                </FormLabel>
                <Switch
                  isChecked={matchingEnabled}
                  onChange={(e) => {
                    setPendingMatchingEnabled(e.target.checked);
                    onMatchingConfirmOpen();
                  }}
                  colorScheme="blue"
                />
              </FormControl>

              <FormControl id="locations">
                <FormLabel>Preferred Locations</FormLabel>
                <Text color={textColor} fontSize="sm" mb={2}>
                  Comma-separated (e.g., Remote, United States, Europe)
                </Text>
                <Input
                  value={locations}
                  onChange={(e) => setLocations(e.target.value)}
                  placeholder="Remote, United States, Europe"
                />
              </FormControl>

              <FormControl id="jobTypes">
                <FormLabel>Job Types</FormLabel>
                <Text color={textColor} fontSize="sm" mb={2}>
                  Comma-separated (e.g., Full-time, Contract, Freelance)
                </Text>
                <Input
                  value={jobTypes}
                  onChange={(e) => setJobTypes(e.target.value)}
                  placeholder="Full-time, Contract"
                />
              </FormControl>

              <FormControl id="industries">
                <FormLabel>Industries</FormLabel>
                <Text color={textColor} fontSize="sm" mb={2}>
                  Comma-separated (e.g., Fintech, Healthtech, AI)
                </Text>
                <Input
                  value={industries}
                  onChange={(e) => setIndustries(e.target.value)}
                  placeholder="Fintech, Healthtech, AI"
                />
              </FormControl>

              <Button
                colorScheme="blue"
                onClick={() => handleSavePreferences()}
                isLoading={prefSaving}
                leftIcon={<FaSave />}
                alignSelf="flex-end"
              >
                Save Preferences
              </Button>
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

        {/* Restart Guides */}
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Heading as="h2" size="md" mb={4}>
              Restart Guides
            </Heading>
            <Text color={textColor} mb={4}>
              Reset and restart the interactive guides to learn about platform
              features again.
            </Text>
            <VStack spacing={3} align="stretch">
              <Button
                colorScheme="blue"
                variant="outline"
                onClick={() => handleResetGuide("dashboard")}
                isDisabled={!guideProgress.dashboard}
              >
                Restart Dashboard Guide
              </Button>
              <Button
                colorScheme="blue"
                variant="outline"
                onClick={() => handleResetGuide("profile")}
                isDisabled={!guideProgress.profile}
              >
                Restart Profile Guide
              </Button>
              <Button
                colorScheme="blue"
                variant="outline"
                onClick={() => handleResetGuide("settings")}
                isDisabled={!guideProgress.settings}
              >
                Restart Settings Guide
              </Button>
              <Button
                colorScheme="blue"
                variant="outline"
                onClick={() => handleResetGuide("wallet")}
                isDisabled={!guideProgress.wallet}
              >
                Restart Wallet Guide
              </Button>
              <Divider />
              <Button
                colorScheme="blue"
                onClick={() => handleResetGuide()}
                isDisabled={Object.keys(guideProgress).length === 0}
              >
                Restart All Guides
              </Button>
            </VStack>
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

      {/* Matching toggle confirmation */}
      <Modal isOpen={isMatchingConfirmOpen} onClose={onMatchingConfirmClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {pendingMatchingEnabled !== null && pendingMatchingEnabled
              ? "Resume matching?"
              : "Pause matching?"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text color={textColor}>
              {pendingMatchingEnabled !== null && pendingMatchingEnabled
                ? "We'll start matching you again and deduct $0.30 when matches are found."
                : "We'll pause matching and stop any wallet deductions until you turn it back on."}
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => {
                setPendingMatchingEnabled(null);
                onMatchingConfirmClose();
              }}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={async () => {
                onMatchingConfirmClose();
                if (pendingMatchingEnabled !== null) {
                  await handleSavePreferences(pendingMatchingEnabled);
                  setPendingMatchingEnabled(null);
                }
              }}
              isLoading={prefSaving}
            >
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Change Email Modal */}
      <Modal isOpen={isEmailChangeOpen} onClose={onEmailChangeClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Change Email</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Text color={textColor}>
                We will send a verification link to the new email. Once
                verified, you’ll be asked to sign in again.
              </Text>
              <FormControl id="newEmail">
                <FormLabel>New Email Address</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <ChakraIcon as={FaEnvelope} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    type="email"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    placeholder="you@example.com"
                  />
                </InputGroup>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEmailChangeClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleEmailChangeRequest}
              isLoading={emailChangeLoading}
            >
              Send Verification
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
};

export default SettingsPage;
