import React, { useState, useEffect, useRef } from "react";
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
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  List,
  ListItem,
} from "@chakra-ui/react";
import { FaPlus, FaTimes, FaEdit } from "react-icons/fa";
import { useApi } from "@/hooks/useApi";
import { parseSkill, formatSkill, getSkillName } from "@/utils/skillUtils";

interface EditSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSkills: string[];
  onSave: (skills: string[]) => Promise<void>;
}

const EditSkillsModal: React.FC<EditSkillsModalProps> = ({
  isOpen,
  onClose,
  currentSkills,
  onSave,
}) => {
  const { searchSkills } = useApi();
  const [skills, setSkills] = useState<string[]>(currentSkills);
  const [newSkill, setNewSkill] = useState("");
  const [skillRating, setSkillRating] = useState<number>(5);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSkills(currentSkills);
  }, [currentSkills, isOpen]);

  useEffect(() => {
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    const trimmedSkill = newSkill.trim();
    if (trimmedSkill.length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const results = await searchSkills(trimmedSkill);
          // Filter out skills that are already in the user's profile
          const existingSkillNames = skills.map((s) => getSkillName(s).toLowerCase());
          const filteredResults = results.filter(
            (suggestion: string) => !existingSkillNames.includes(suggestion.toLowerCase())
          );
          setSuggestions(filteredResults);
          setShowSuggestions(filteredResults.length > 0);
        } catch (error) {
          console.error("Error searching skills:", error);
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newSkill, skills]);

  const handleAddSkill = (skillName?: string, rating?: number) => {
    const skillToAdd = skillName || newSkill.trim();
    const ratingToUse = rating !== undefined ? rating : skillRating;

    if (!skillToAdd) {
      toast({
        title: "Validation error",
        description: "Please enter a skill name",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    // Check if skill already exists (compare by name only, case-insensitive)
    const skillNameToAdd = skillToAdd.trim();
    const existingSkillNames = skills.map((s) => getSkillName(s).toLowerCase());
    if (existingSkillNames.includes(skillNameToAdd.toLowerCase())) {
      // Silently ignore duplicates - don't add and don't show error
      return;
    }

    const formattedSkill = formatSkill(skillNameToAdd, ratingToUse);
    setSkills([...skills, formattedSkill]);
    setNewSkill("");
    setSkillRating(5);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setNewSkill(suggestion);
    setShowSuggestions(false);
    // Focus back on input to allow rating adjustment
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleEditSkill = (skill: string) => {
    const parsed = parseSkill(skill);
    setNewSkill(parsed.name);
    setSkillRating(parsed.rating || 5);
    handleRemoveSkill(skill);
    inputRef.current?.focus();
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave(skills);
      toast({
        title: "Skills updated",
        description: "Your skills have been updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error updating skills",
        description: error.message || "There was an error updating your skills",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[0]);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const labelStyles = {
    mt: "2",
    ml: "-2.5",
    fontSize: "sm",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Skills</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Add Skill</FormLabel>
              <Box position="relative">
                <InputGroup>
                  <Input
                    ref={inputRef}
                    value={newSkill}
                    onChange={(e) => {
                      setNewSkill(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onKeyPress={handleKeyPress}
                    onFocus={() => {
                      if (suggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay to allow suggestion click
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder="Start typing to search existing skills..."
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={() => handleAddSkill()}
                      leftIcon={<FaPlus />}
                    >
                      Add
                    </Button>
                  </InputRightElement>
                </InputGroup>
                {showSuggestions && suggestions.length > 0 && (
                  <Box
                    position="absolute"
                    zIndex={1000}
                    w="100%"
                    mt={1}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    boxShadow="md"
                    maxH="200px"
                    overflowY="auto"
                  >
                    <List spacing={0}>
                      {suggestions.map((suggestion, index) => (
                        <ListItem
                          key={index}
                          px={4}
                          py={2}
                          cursor="pointer"
                          _hover={{ bg: "gray.100" }}
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <Text fontSize="sm">{suggestion}</Text>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                {isSearching && (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Searching...
                  </Text>
                )}
              </Box>
            </FormControl>

            {newSkill.trim() && (
              <FormControl>
                <FormLabel>
                  Rate your proficiency (1-10)
                  <Text fontSize="xs" color="gray.500" fontWeight="normal" mt={1}>
                    Employers never see this, but we use it to match you with
                    the best jobs
                  </Text>
                </FormLabel>
                <Box px={2} pt={6} pb={2}>
                  <Slider
                    value={skillRating}
                    onChange={(val) => setSkillRating(val)}
                    min={1}
                    max={10}
                    step={1}
                  >
                    <SliderMark value={1} {...labelStyles}>
                      1
                    </SliderMark>
                    <SliderMark value={5} {...labelStyles}>
                      5
                    </SliderMark>
                    <SliderMark value={10} {...labelStyles}>
                      10
                    </SliderMark>
                    <SliderMark
                      value={skillRating}
                      textAlign="center"
                      bg="blue.500"
                      color="white"
                      mt="-10"
                      ml="-5"
                      w="12"
                      borderRadius="md"
                    >
                      {skillRating}/10
                    </SliderMark>
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </Box>
              </FormControl>
            )}

            <Box>
              <FormLabel>Current Skills ({skills.length})</FormLabel>
              <HStack spacing={2} flexWrap="wrap" mt={2}>
                {skills.map((skill, index) => {
                  const parsed = parseSkill(skill);
                  return (
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
                      <Text as="span">
                        {parsed.name}
                        {parsed.rating !== null && (
                          <Text as="span" opacity={0.8} fontSize="xs" ml={1}>
                            ({parsed.rating}/10)
                          </Text>
                        )}
                      </Text>
                      <HStack spacing={1} ml={1}>
                        <Box
                          as="button"
                          aria-label="Edit skill"
                          onClick={() => handleEditSkill(skill)}
                          cursor="pointer"
                          _hover={{ opacity: 0.8 }}
                          display="inline-flex"
                          alignItems="center"
                        >
                          <FaEdit size={8} />
                        </Box>
                        <Box
                          as="button"
                          aria-label="Remove skill"
                          onClick={() => handleRemoveSkill(skill)}
                          cursor="pointer"
                          _hover={{ opacity: 0.8 }}
                          display="inline-flex"
                          alignItems="center"
                        >
                          <FaTimes size={10} />
                        </Box>
                      </HStack>
                    </Badge>
                  );
                })}
                {skills.length === 0 && (
                  <Text color="gray.500" fontSize="sm">
                    No skills added yet
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

export default EditSkillsModal;
