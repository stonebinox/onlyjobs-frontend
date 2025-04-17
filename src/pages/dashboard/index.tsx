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
} from "@chakra-ui/react";
import {
  FiUsers,
  FiBriefcase,
  FiCheckCircle,
  FiTrendingUp,
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
  const auth = useAuth();
  const router = useRouter();
  const { getAvailableJobsCount } = useApi();

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

    fetchAvailableJobsCount();
  }, [auth?.isLoggedIn, getAvailableJobsCount, router]);

  return (
    <DashboardLayout>
      <Box>
        <Heading mb={5}>Dashboard</Heading>

        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={{ base: 5, lg: 8 }}
        >
          <StatCard
            title="Active Candidates"
            stat="1,284"
            icon={<FiUsers size="3em" />}
          />
          <StatCard
            title="Job Listings"
            stat={availableJobsCount.toString()}
            icon={<FiBriefcase size="3em" />}
          />
          <StatCard
            title="Successful Matches"
            stat="156"
            icon={<FiCheckCircle size="3em" />}
          />
          <StatCard
            title="Monthly Growth"
            stat="15%"
            icon={<FiTrendingUp size="3em" />}
          />
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
  );
};

export default Dashboard;
