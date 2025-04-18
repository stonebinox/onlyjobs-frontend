import {
  Box,
  SimpleGrid,
  Heading,
  Text,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
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
  Input,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import {
  FiUsers,
  FiBriefcase,
  FiCheckCircle,
  FiTrendingUp,
  FiUpload,
} from "react-icons/fi";

import DashboardLayout from "../../components/Layout/DashboardLayout";
import StatCard from "../../components/Dashboard/StatCard";
import JobListing, {
  JobListingProps,
} from "../../components/Dashboard/JobListing";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";

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
];

const Dashboard = () => {
  const [availableJobsCount, setAvailableJobsCount] = useState<number>(0);
  const [activeUserCount, setActiveUserCount] = useState<number>(0);
  const [matchCount, setMatchCount] = useState<number>(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const auth = useAuth();
  const router = useRouter();
  const { getAvailableJobsCount, getActiveUserCount, uploadCV, getMatchCount } =
    useApi();

  useEffect(() => {
    if (!auth?.isLoggedIn) {
      router.push("/");
    }

    const fetchAvailableJobsCount = async () => {
      try {
        const count: number = await getAvailableJobsCount();
        setAvailableJobsCount(count);
      } catch (error) {
        console.error("Error fetching available jobs count:", error);
      }
    };

    const fetchActiveUserCount = async () => {
      try {
        const count: number = await getActiveUserCount();
        setActiveUserCount(count);
      } catch (error) {
        console.error("Error fetching active user count:", error);
      }
    };

    const fetchMatchCount = async () => {
      try {
        const count: number = await getMatchCount();
        setMatchCount(count);
      } catch (error) {
        console.error("Error fetching match count:", error);
      }
    };

    fetchMatchCount();
    fetchActiveUserCount();
    fetchAvailableJobsCount();
  }, [
    auth?.isLoggedIn,
    getActiveUserCount,
    getAvailableJobsCount,
    getMatchCount,
    router,
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadedFile(file);
    setUploadSuccess(false);
    setUploadError(null);
  };

  const handleCVUpload = async () => {
    if (!uploadedFile) {
      setUploadError("Please select a file to upload");
      return;
    }

    // Check file type (PDF, DOC, DOCX)
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!validTypes.includes(uploadedFile.type)) {
      setUploadError("Please upload a PDF or Word document");

      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const response = await uploadCV(uploadedFile);
      if (!response) {
        setUploadError("Failed to upload CV. Please try again.");

        return;
      }

      if (response.error) {
        setUploadError(response.error);

        return;
      }

      setUploadSuccess(true);
      setUploadedFile(null);

      // Reset the file input (optional)
      const fileInput = document.getElementById(
        "cv-upload"
      ) as HTMLInputElement;

      if (fileInput) fileInput.value = "";

      setTimeout(() => {
        onClose();
        setUploadSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error uploading CV:", error);
      setUploadError("Failed to upload CV. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <DashboardLayout>
        <Box>
          <Heading mb={5}>Dashboard</Heading>

          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 4 }}
            spacing={{ base: 5, lg: 8 }}
          >
            <StatCard
              title="Active Candidates"
              stat={new Intl.NumberFormat("en-US").format(activeUserCount)}
              icon={<FiUsers size="3em" />}
            />
            <StatCard
              title="Job Listings"
              stat={new Intl.NumberFormat("en-US").format(availableJobsCount)}
              icon={<FiBriefcase size="3em" />}
            />
            <StatCard
              title="Successful Matches"
              stat={new Intl.NumberFormat("en-US").format(matchCount)}
              icon={<FiCheckCircle size="3em" />}
            />
            <Box
              p={5}
              shadow="md"
              borderWidth="1px"
              borderRadius="lg"
              bg="white"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
            >
              <Button
                leftIcon={<FiTrendingUp size="1.5em" />}
                colorScheme="blue"
                variant="solid"
                size="sm"
                onClick={onOpen}
                w="100%"
              >
                Upload Your CV
              </Button>
              <Text fontSize="sm" mt={2} color="gray.500" textAlign="center">
                Improve your match rate
              </Text>
            </Box>
          </SimpleGrid>
          <Box mt={10}>
            <Tabs colorScheme="blue">
              <TabList>
                <Tab>Recent Jobs</Tab>
                <Tab>Recent Candidates</Tab>
                <Tab>Recent Matches</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <Flex direction="column" gap={4}>
                    {jobListings.map((job) => (
                      <JobListing key={job.id} {...job} />
                    ))}
                  </Flex>
                </TabPanel>
                <TabPanel>
                  <Text>Recent candidates will appear here.</Text>
                </TabPanel>
                <TabPanel>
                  <Text>Recent matches will appear here.</Text>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </Box>
      </DashboardLayout>
      {/* CV Upload Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload Your CV</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {uploadSuccess && (
              <Alert status="success" mb={4}>
                <AlertIcon />
                CV uploaded successfully!
              </Alert>
            )}

            {uploadError && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                {uploadError}
              </Alert>
            )}

            <FormControl>
              <FormLabel htmlFor="cv-upload">
                Select your CV (PDF or Word document)
              </FormLabel>
              <Input
                id="cv-upload"
                type="file"
                py={1}
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
              <Text mt={2} fontSize="sm" color="gray.500">
                Supported formats: PDF, DOC, DOCX
              </Text>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCVUpload}
              isLoading={isUploading}
              loadingText="Uploading"
              leftIcon={<FiUpload />}
              isDisabled={!uploadedFile || uploadSuccess}
            >
              Upload
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default Dashboard;
