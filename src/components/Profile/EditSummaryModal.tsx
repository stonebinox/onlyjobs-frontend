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

interface EditSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSummary: string;
  onSave: (summary: string) => Promise<void>;
}

const EditSummaryModal: React.FC<EditSummaryModalProps> = ({
  isOpen,
  onClose,
  currentSummary,
  onSave,
}) => {
  const [summary, setSummary] = useState(currentSummary);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setSummary(currentSummary);
  }, [currentSummary, isOpen]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave(summary);
      toast({
        title: "Summary updated",
        description: "Your resume summary has been updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error updating summary",
        description: error.message || "There was an error updating your summary",
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
        <ModalHeader>Edit Resume Summary</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Summary</FormLabel>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter your professional summary..."
              rows={6}
              resize="vertical"
            />
          </FormControl>
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

export default EditSummaryModal;

