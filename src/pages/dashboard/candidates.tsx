import {
  Box,
  Heading,
  SimpleGrid,
  Flex,
  Button,
  Text,
  Avatar,
  Badge,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import JobSeekerForm from "../../components/JobForm/JobSeekerForm";

interface CandidateCardProps {
  name: string;
  role: string;
  experience: string;
  location: string;
  skills: string[];
  isNew?: boolean;
}

const CandidateCard = ({
  name,
  role,
  experience,
  location,
  skills,
  isNew = false,
}: CandidateCardProps) => {
  return (
    <Box
      p={5}
      shadow="md"
      borderWidth="1px"
      borderRadius="lg"
      bg={useColorModeValue("white", "gray.700")}
      position="relative"
    >
      {isNew && (
        <Badge colorScheme="green" position="absolute" top={2} right={2}>
          New
        </Badge>
      )}

      <Flex alignItems="center">
        <Avatar size="lg" name={name} mr={4} />
        <Box>
          <Heading size="md">{name}</Heading>
          <Text color="gray.500">{role}</Text>
        </Box>
      </Flex>

      <Box mt={4}>
        <Flex mt={2}>
          <Text fontWeight="bold" mr={2}>
            Experience:
          </Text>
          <Text>{experience}</Text>
        </Flex>
        <Flex mt={2}>
          <Text fontWeight="bold" mr={2}>
            Location:
          </Text>
          <Text>{location}</Text>
        </Flex>
      </Box>

      <Box mt={4}>
        <Text fontWeight="bold" mb={2}>
          Skills:
        </Text>
        <Flex wrap="wrap">
          {skills.map((skill, index) => (
            <Badge key={index} colorScheme="blue" mr={2} mb={2}>
              {skill}
            </Badge>
          ))}
        </Flex>
      </Box>

      <Flex justifyContent="flex-end" mt={4}>
        <Button size="sm" variant="outline" mr={2}>
          View Profile
        </Button>
        <Button size="sm" colorScheme="blue">
          Contact
        </Button>
      </Flex>
    </Box>
  );
};

const dummyCandidates: CandidateCardProps[] = [
  {
    name: "James Wilson",
    role: "Senior Frontend Developer",
    experience: "7 years",
    location: "San Francisco, CA",
    skills: ["React", "TypeScript", "GraphQL", "CSS", "Node.js"],
    isNew: true,
  },
  {
    name: "Emily Johnson",
    role: "UX/UI Designer",
    experience: "5 years",
    location: "Remote",
    skills: ["Figma", "Adobe XD", "Sketch", "User Research", "Prototyping"],
  },
  {
    name: "Michael Chen",
    role: "Full Stack Developer",
    experience: "3 years",
    location: "New York, NY",
    skills: ["JavaScript", "React", "Node.js", "MongoDB", "Express"],
  },
  {
    name: "Sophia Rodriguez",
    role: "Product Manager",
    experience: "6 years",
    location: "Austin, TX",
    skills: [
      "Product Strategy",
      "Agile",
      "User Stories",
      "Roadmapping",
      "Analytics",
    ],
    isNew: true,
  },
  {
    name: "David Kim",
    role: "DevOps Engineer",
    experience: "4 years",
    location: "Seattle, WA",
    skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform"],
  },
  {
    name: "Olivia Taylor",
    role: "Data Scientist",
    experience: "3 years",
    location: "Remote",
    skills: ["Python", "R", "Machine Learning", "SQL", "Data Visualization"],
  },
];

const CandidatesPage = () => {
  return (
    <DashboardLayout>
      <Box>
        <Heading mb={5}>Candidates</Heading>

        <Tabs colorScheme="blue" mb={6}>
          <TabList>
            <Tab>All Candidates</Tab>
            <Tab>New Applicants</Tab>
            <Tab>Add Candidate</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
                {dummyCandidates.map((candidate, index) => (
                  <CandidateCard key={index} {...candidate} />
                ))}
              </SimpleGrid>
            </TabPanel>

            <TabPanel px={0}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
                {dummyCandidates
                  .filter((candidate) => candidate.isNew)
                  .map((candidate, index) => (
                    <CandidateCard key={index} {...candidate} />
                  ))}
              </SimpleGrid>
            </TabPanel>

            <TabPanel px={0}>
              <JobSeekerForm />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </DashboardLayout>
  );
};

export default CandidatesPage;
