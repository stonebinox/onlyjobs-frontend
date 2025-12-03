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
  Textarea,
  useToast,
} from "@chakra-ui/react";

interface EditArrayItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentValue: string;
  fieldLabel: string;
  onSave: (value: string) => Promise<void>;
}

const EditArrayItemModal: React.FC<EditArrayItemModalProps> = ({
  isOpen,
  onClose,
  currentValue,
  fieldLabel,
  onSave,
}) => {
  const [value, setValue] = useState(currentValue);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setValue(currentValue);
  }, [currentValue, isOpen]);

  const handleSave = async () => {
    if (!value.trim()) {
      toast({
        title: "Validation error",
        description: "Please enter a value",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      await onSave(value.trim());
      toast({
        title: "Item updated",
        description: `Your ${fieldLabel.toLowerCase()} has been updated successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error updating item",
        description: error.message || "There was an error updating the item",
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
        <ModalHeader>Edit {fieldLabel}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>{fieldLabel}</FormLabel>
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Enter ${fieldLabel.toLowerCase()}...`}
              rows={4}
              resize="vertical"
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="gray" mr={3} onClick={onClose}>
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

export default EditArrayItemModal;

