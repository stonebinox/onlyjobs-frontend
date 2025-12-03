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
  InputGroup,
  InputRightElement,
  VStack,
  HStack,
  Badge,
  Box,
  Text,
  useToast,
} from "@chakra-ui/react";
import { FaPlus, FaTimes } from "react-icons/fa";

interface EditLanguagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguages: string[];
  onSave: (languages: string[]) => Promise<void>;
}

const EditLanguagesModal: React.FC<EditLanguagesModalProps> = ({
  isOpen,
  onClose,
  currentLanguages,
  onSave,
}) => {
  const [languages, setLanguages] = useState<string[]>(currentLanguages);
  const [newLanguage, setNewLanguage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setLanguages(currentLanguages);
  }, [currentLanguages, isOpen]);

  const handleAddLanguage = () => {
    const trimmedLanguage = newLanguage.trim();
    if (trimmedLanguage && !languages.includes(trimmedLanguage)) {
      setLanguages([...languages, trimmedLanguage]);
      setNewLanguage("");
    } else if (languages.includes(trimmedLanguage)) {
      toast({
        title: "Duplicate language",
        description: "This language already exists",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleRemoveLanguage = (languageToRemove: string) => {
    setLanguages(languages.filter((language) => language !== languageToRemove));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave(languages);
      toast({
        title: "Languages updated",
        description: "Your languages have been updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error updating languages",
        description: error.message || "There was an error updating your languages",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddLanguage();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Languages</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Add Language</FormLabel>
              <InputGroup>
                <Input
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter a language and press Enter or click Add"
                />
                <InputRightElement width="4.5rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    onClick={handleAddLanguage}
                    leftIcon={<FaPlus />}
                  >
                    Add
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
            <Box>
              <FormLabel>Current Languages ({languages.length})</FormLabel>
              <HStack spacing={2} flexWrap="wrap" mt={2}>
                {languages.map((language, index) => (
                  <Badge
                    key={index}
                    colorScheme="blue"
                    variant="solid"
                    borderRadius="full"
                    px={3}
                    py={1}
                    display="inline-flex"
                    alignItems="center"
                    gap={1}
                  >
                    <Text as="span">{language}</Text>
                    <Box
                      as="button"
                      aria-label="Remove language"
                      onClick={() => handleRemoveLanguage(language)}
                      ml={1}
                      cursor="pointer"
                      _hover={{ opacity: 0.8 }}
                      display="inline-flex"
                      alignItems="center"
                    >
                      <FaTimes size={10} />
                    </Box>
                  </Badge>
                ))}
                {languages.length === 0 && (
                  <Text color="gray.500" fontSize="sm">
                    No languages added yet
                  </Text>
                )}
              </HStack>
            </Box>
          </VStack>
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

export default EditLanguagesModal;

