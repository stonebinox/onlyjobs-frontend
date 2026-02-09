import React, { useState } from "react";
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
  Input,
  VStack,
  useToast,
} from "@chakra-ui/react";

interface AddArrayItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldLabel: string;
  supportsLink?: boolean;
  onSave: (value: string, link?: string) => Promise<void>;
}

const AddArrayItemModal: React.FC<AddArrayItemModalProps> = ({
  isOpen,
  onClose,
  fieldLabel,
  supportsLink = false,
  onSave,
}) => {
  const [value, setValue] = useState("");
  const [link, setLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

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
      await onSave(value.trim(), link.trim() || undefined);
      toast({
        title: "Item added",
        description: `Your ${fieldLabel.toLowerCase()} has been added successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setValue("");
      setLink("");
      onClose();
    } catch (error: any) {
      toast({
        title: "Error adding item",
        description: error.message || "There was an error adding the item",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setValue("");
    setLink("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add {fieldLabel}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
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
            {supportsLink && (
              <FormControl>
                <FormLabel>Link (optional)</FormLabel>
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com"
                  type="url"
                />
              </FormControl>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isLoading}>
            Add
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddArrayItemModal;

