import {
  Box,
  Heading,
  Flex,
  Input,
  Button,
  HStack,
  Select,
  VStack,
  IconButton,
  InputGroup,
  InputLeftElement,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { FiSearch, FiFilter, FiPlus } from "react-icons/fi";
import { useState } from "react";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import JobListing, {
  JobListingProps,
} from "../../components/Dashboard/JobListing";

// Dummy data
const jobListings: JobListingProps[] = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    salary: "$120,000 - $150,000",
    type: "Full-time",
    description:
      "We are looking for an experienced Frontend Developer to join our team. The ideal candidate should have 5+ years of experience with React and modern JavaScript.",
    postedDate: "2 days ago",
    applicants: 12,
    isHot: true,
  },
  {
    id: "2",
    title: "Product Manager",
    company: "InnovateTech",
    location: "Remote",
    salary: "$110,000 - $130,000",
    type: "Full-time",
    description:
      "InnovateTech is seeking a Product Manager to lead our product development efforts. You will work closely with engineering, design, and marketing teams.",
    postedDate: "1 week ago",
    applicants: 24,
  },
  {
    id: "3",
    title: "DevOps Engineer",
    company: "CloudSys Solutions",
    location: "New York, NY",
    salary: "$130,000 - $160,000",
    type: "Full-time",
    description:
      "Join our DevOps team to build and maintain our cloud infrastructure. Experience with AWS, Kubernetes, and CI/CD pipelines is required.",
    postedDate: "3 days ago",
    applicants: 8,
    isHot: true,
  },
  {
    id: "4",
    title: "UX/UI Designer",
    company: "DesignPro Agency",
    location: "Chicago, IL",
    salary: "$90,000 - $110,000",
    type: "Full-time",
    description:
      "We are looking for a creative UX/UI Designer to join our design team. You will create user-centered designs for web and mobile applications.",
    postedDate: "1 week ago",
    applicants: 19,
  },
  {
    id: "5",
    title: "Data Scientist",
    company: "DataInsights",
    location: "Remote",
    salary: "$140,000 - $170,000",
    type: "Full-time",
    description:
      "We are seeking a Data Scientist with expertise in machine learning and statistical modeling to join our analytics team.",
    postedDate: "5 days ago",
    applicants: 15,
    isHot: true,
  },
];

const JobsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [newJobForm, setNewJobForm] = useState({
    title: "",
    company: "",
    location: "",
    salary: "",
    type: "Full-time",
    description: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setNewJobForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddJob = () => {
    // In a real application, this would make an API call to add the job
    console.log("Adding job:", newJobForm);
    onClose();
    // Reset form
    setNewJobForm({
      title: "",
      company: "",
      location: "",
      salary: "",
      type: "Full-time",
      description: "",
    });
  };

  const filteredJobs = jobListings.filter((job) => {
    const matchesSearch =
      searchTerm === "" ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "" || job.type === filterType;
    const matchesLocation =
      filterLocation === "" || job.location.includes(filterLocation);

    return matchesSearch && matchesType && matchesLocation;
  });

  return (
    <DashboardLayout>
      <Box>
        <Flex justifyContent="space-between" alignItems="center" mb={5}>
          <Heading>Job Listings</Heading>
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
            Add Job
          </Button>
        </Flex>

        <Flex
          direction={{ base: "column", md: "row" }}
          mb={6}
          gap={4}
          alignItems={{ base: "stretch", md: "flex-end" }}
        >
          <VStack flex="1" align="stretch">
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </VStack>

          <HStack spacing={4} w={{ base: "100%", md: "auto" }}>
            <Select
              placeholder="Job Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Freelance">Freelance</option>
            </Select>

            <Select
              placeholder="Location"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            >
              <option value="Remote">Remote</option>
              <option value="New York">New York</option>
              <option value="San Francisco">San Francisco</option>
              <option value="London">London</option>
            </Select>

            <IconButton aria-label="Advanced filters" icon={<FiFilter />} />
          </HStack>
        </Flex>

        <VStack spacing={4} align="stretch">
          {filteredJobs.map((job) => (
            <JobListing key={job.id} {...job} />
          ))}

          {filteredJobs.length === 0 && (
            <Box textAlign="center" py={10}>
              No jobs match your search criteria.
            </Box>
          )}
        </VStack>

        {/* Add Job Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add New Job</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Job Title</FormLabel>
                  <Input
                    name="title"
                    value={newJobForm.title}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Company</FormLabel>
                  <Input
                    name="company"
                    value={newJobForm.company}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Location</FormLabel>
                  <Input
                    name="location"
                    value={newJobForm.location}
                    onChange={handleInputChange}
                    placeholder="City, State or Remote"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Salary Range</FormLabel>
                  <Input
                    name="salary"
                    value={newJobForm.salary}
                    onChange={handleInputChange}
                    placeholder="e.g. $80,000 - $100,000"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Job Type</FormLabel>
                  <Select
                    name="type"
                    value={newJobForm.type}
                    onChange={handleInputChange}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Input
                    as="textarea"
                    name="description"
                    value={newJobForm.description}
                    onChange={handleInputChange}
                    placeholder="Job description"
                    minHeight="100px"
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleAddJob}>
                Add Job
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </DashboardLayout>
  );
};

export default JobsPage;
