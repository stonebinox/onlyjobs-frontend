import React, { useState } from "react";
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
} from "@chakra-ui/react";
import DashboardLayout from "../components/Layout/DashboardLayout";

const SettingsPage = () => {
  // State for form fields
  const [email, setEmail] = useState("user@example.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [matchScore, setMatchScore] = useState(70);

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

  // Mock handlers - would connect to API in real implementation
  const handleUpdateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Account updated",
      description: "Your account information has been updated successfully",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleUpdatePreferences = () => {
    toast({
      title: "Preferences updated",
      description: `Match score preference set to ${matchScore}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account deleted",
      description: "Your account has been deleted",
      status: "error",
      duration: 5000,
      isClosable: true,
    });
    onDeleteClose();
  };

  const handleFactoryReset = () => {
    toast({
      title: "Data reset complete",
      description: "Your CV data, preferences, and Q&A have been reset",
      status: "info",
      duration: 5000,
      isClosable: true,
    });
    onResetClose();
  };

  const labelStyles = {
    mt: "2",
    ml: "-2.5",
    fontSize: "sm",
  };

  return (
    <DashboardLayout>
      <VStack spacing={6} align="stretch">
        {/* Account Settings */}
        <Card bg={cardBg} shadow="md">
          <CardBody>
            <Heading as="h2" size="md" mb={4}>
              Account Settings
            </Heading>
            <form onSubmit={handleUpdateAccount}>
              <VStack spacing={4} align="stretch">
                <FormControl id="email">
                  <FormLabel>Email address</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </FormControl>
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
                  />
                </FormControl>
                <FormControl id="newPassword">
                  <FormLabel>New Password</FormLabel>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </FormControl>
                <FormControl id="confirmPassword">
                  <FormLabel>Confirm New Password</FormLabel>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </FormControl>
                <Button type="submit" colorScheme="blue" alignSelf="flex-end">
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
              <Button
                colorScheme="blue"
                alignSelf="flex-end"
                onClick={handleUpdatePreferences}
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
            <Button colorScheme="orange" onClick={onResetOpen}>
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
            <Button colorScheme="red" onClick={onDeleteOpen}>
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
