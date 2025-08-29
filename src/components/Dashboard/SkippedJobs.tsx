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

interface SkippedJobsProps {
  loading: boolean;
  jobs: JobResult[];
  openJobQuestionsDrawer: (jobResult: JobResult) => void;
}

export const SkippedJobs = ({
  loading,
  jobs,
  openJobQuestionsDrawer,
}: SkippedJobsProps) => {
  const skippedJobs = useMemo(() => {
    return jobs
      .filter((job) => job.skipped)
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
            Skipped Jobs &bull; {skippedJobs.length} jobs
          </Text>
        </Box>
        {skippedJobs.length > 0 ? (
          <Flex direction="column" gap={4}>
            {skippedJobs.map((job) => (
              <Box key={job._id}>
                <JobListing
                  job={job}
                  bypassSkippedFiltering={true}
                  openJobQuestionsDrawer={openJobQuestionsDrawer}
                />
              </Box>
            ))}
          </Flex>
        ) : (
          <Flex p={4} direction="column">
            <Text>You haven&apos;t skipped any jobs yet.</Text>
          </Flex>
        )}
      </StyledSkeleton>
    </Flex>
  );
};
