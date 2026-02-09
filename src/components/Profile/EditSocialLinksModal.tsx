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
import { SocialLinks } from "@/types/User";

interface EditSocialLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSocialLinks: SocialLinks;
  onSave: (socialLinks: SocialLinks) => Promise<void>;
}

const EditSocialLinksModal: React.FC<EditSocialLinksModalProps> = ({
  isOpen,
  onClose,
  currentSocialLinks,
  onSave,
}) => {
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(currentSocialLinks);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setSocialLinks(currentSocialLinks);
  }, [currentSocialLinks, isOpen]);

  const handleChange = (field: keyof SocialLinks, value: string) => {
    setSocialLinks({
      ...socialLinks,
      [field]: value,
    });
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave(socialLinks);
      toast({
        title: "Social links updated",
        description: "Your social links have been updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error updating social links",
        description: error.message || "There was an error updating your social links",
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
        <ModalHeader>Edit Social Links</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>LinkedIn</FormLabel>
              <Input
                value={socialLinks.linkedin || ""}
                onChange={(e) => handleChange("linkedin", e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </FormControl>

            <FormControl>
              <FormLabel>GitHub</FormLabel>
              <Input
                value={socialLinks.github || ""}
                onChange={(e) => handleChange("github", e.target.value)}
                placeholder="https://github.com/username"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Portfolio</FormLabel>
              <Input
                value={socialLinks.portfolio || ""}
                onChange={(e) => handleChange("portfolio", e.target.value)}
                placeholder="https://yourportfolio.com"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Twitter</FormLabel>
              <Input
                value={socialLinks.twitter || ""}
                onChange={(e) => handleChange("twitter", e.target.value)}
                placeholder="https://twitter.com/username"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Website</FormLabel>
              <Input
                value={socialLinks.website || ""}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://yourwebsite.com"
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

export default EditSocialLinksModal;
