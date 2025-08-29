import { Box, Flex, Skeleton, Text } from "@chakra-ui/react";
import styled from "styled-components";
import { useMemo } from "react";

import { JobResult } from "@/types/JobResult";
import JobListing from "./JobListing";

const StyledSkeleton = styled(Skeleton)`
  width: 100%;
  height: auto;
  padding: 16px;
  border-radius: 8px;
`;

interface VisitedJobsProps {
  loading: boolean;
  jobs: JobResult[];
  openJobQuestionsDrawer: (jobResult: JobResult) => void;
}

export const VisitedJobs = ({
  loading,
  jobs,
  openJobQuestionsDrawer,
}: VisitedJobsProps) => {
  const visitedJobs = useMemo(() => {
    return jobs
      .filter((job) => job.clicked && !job.skipped)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [jobs]);

  return (
    <Flex direction="column">
      <StyledSkeleton isLoaded={!loading}>
        <Box p={4}>
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Visited Jobs &bull; {visitedJobs.length} jobs
          </Text>
        </Box>
        {visitedJobs.length > 0 ? (
          <Flex direction="column" gap={4}>
            {visitedJobs.map((job) => (
              <Box key={job._id}>
                <JobListing
                  job={job}
                  openJobQuestionsDrawer={openJobQuestionsDrawer}
                />
              </Box>
            ))}
          </Flex>
        ) : (
          <Flex p={4} direction="column">
            <Text>You haven&apos;t visited any jobs yet.</Text>
          </Flex>
        )}
      </StyledSkeleton>
    </Flex>
  );
};
