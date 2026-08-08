import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { CountrySelect } from "@/components/common/CountrySelect";

interface EditPersonalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentPhone: string;
  currentLocation: string | null;
  onSave: (name: string, phone: string, currentLocation: string | null | undefined) => Promise<void>;
}

const EditPersonalInfoModal: React.FC<EditPersonalInfoModalProps> = ({
  isOpen,
  onClose,
  currentName,
  currentPhone,
  currentLocation,
  onSave,
}) => {
  const [name, setName] = useState(currentName);
  const [phone, setPhone] = useState(currentPhone);
  const [location, setLocation] = useState(currentLocation || "");
  const [initialLocation, setInitialLocation] = useState(currentLocation || "");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setName(currentName);
    setPhone(currentPhone);
    const loc = currentLocation || "";
    setLocation(loc);
    setInitialLocation(loc);
  }, [currentName, currentPhone, currentLocation, isOpen]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      // Only send currentLocation if it changed; undefined lets the backend skip it.
      const locationToSend = location !== initialLocation
        ? (location || null)
        : undefined;
      await onSave(name, phone, locationToSend);
      toast({
        title: "Personal info updated",
        description: "Your personal information has been updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error updating personal info",
        description: error.message || "There was an error updating your information",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Personal Information</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Phone Number</FormLabel>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                type="tel"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Current Location</FormLabel>
              <CountrySelect
                value={location}
                onChange={setLocation}
                placeholder="Select your country"
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isLoading}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditPersonalInfoModal;
