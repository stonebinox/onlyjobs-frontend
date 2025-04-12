import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Textarea,
  Select,
  useToast,
  FormErrorMessage,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";

const JobSeekerForm = () => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    resume: "",
    experience: "",
    currentRole: "",
    desiredRole: "",
    location: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addSkill = () => {
    if (currentSkill && !skills.includes(currentSkill)) {
      setSkills([...skills, currentSkill]);
      setCurrentSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = "Full name is required";
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.desiredRole)
      newErrors.desiredRole = "Desired role is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Mock API call - would be replaced with actual backend call
      console.log({ ...formData, skills });

      toast({
        title: "Profile submitted.",
        description: "We've received your job seeker profile.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        resume: "",
        experience: "",
        currentRole: "",
        desiredRole: "",
        location: "",
      });
      setSkills([]);
    }
  };

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white">
      <Heading size="md" mb={4}>
        Job Seeker Profile
      </Heading>

      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired isInvalid={!!errors.fullName}>
            <FormLabel>Full Name</FormLabel>
            <Input
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Enter your full name"
            />
            <FormErrorMessage>{errors.fullName}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.email}>
            <FormLabel>Email</FormLabel>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
            />
            <FormErrorMessage>{errors.email}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.phone}>
            <FormLabel>Phone</FormLabel>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
            />
            <FormErrorMessage>{errors.phone}</FormErrorMessage>
          </FormControl>

          <FormControl>
            <FormLabel>Resume Link</FormLabel>
            <Input
              name="resume"
              value={formData.resume}
              onChange={handleInputChange}
              placeholder="Link to your resume (Google Drive, Dropbox, etc.)"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Experience (years)</FormLabel>
            <Select
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              placeholder="Select experience"
            >
              <option value="0-1">0-1 years</option>
              <option value="1-3">1-3 years</option>
              <option value="3-5">3-5 years</option>
              <option value="5-10">5-10 years</option>
              <option value="10+">10+ years</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Current Role</FormLabel>
            <Input
              name="currentRole"
              value={formData.currentRole}
              onChange={handleInputChange}
              placeholder="Your current job title"
            />
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.desiredRole}>
            <FormLabel>Desired Role</FormLabel>
            <Input
              name="desiredRole"
              value={formData.desiredRole}
              onChange={handleInputChange}
              placeholder="Job title you're looking for"
            />
            <FormErrorMessage>{errors.desiredRole}</FormErrorMessage>
          </FormControl>

          <FormControl>
            <FormLabel>Preferred Location</FormLabel>
            <Input
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, State or Remote"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Skills</FormLabel>
            <InputGroup size="md">
              <Input
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                placeholder="Add a skill"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <InputRightElement width="4.5rem">
                <Button h="1.75rem" size="sm" onClick={addSkill}>
                  Add
                </Button>
              </InputRightElement>
            </InputGroup>

            <Box mt={2}>
              <HStack spacing={2} wrap="wrap">
                {skills.map((skill, index) => (
                  <Tag
                    size="md"
                    key={index}
                    borderRadius="full"
                    variant="solid"
                    colorScheme="blue"
                    m={1}
                  >
                    <TagLabel>{skill}</TagLabel>
                    <TagCloseButton onClick={() => removeSkill(skill)} />
                  </Tag>
                ))}
              </HStack>
            </Box>
          </FormControl>

          <Button type="submit" colorScheme="blue" alignSelf="flex-start">
            Submit Profile
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default JobSeekerForm;
