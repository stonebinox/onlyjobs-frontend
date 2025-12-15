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

interface AppliedJobsProps {
  loading: boolean;
  jobs: JobResult[];
  openJobQuestionsDrawer: (jobResult: JobResult) => void;
  onApplyClick?: (jobResult: JobResult) => void;
}

export const AppliedJobs = ({
  loading,
  jobs,
  openJobQuestionsDrawer,
  onApplyClick,
}: AppliedJobsProps) => {
  const appliedJobs = useMemo(() => {
    return jobs
      .filter((job) => job.applied === true)
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
            Applied Jobs &bull; {appliedJobs.length} jobs
          </Text>
        </Box>
        {appliedJobs.length > 0 ? (
          <Flex direction="column" gap={4}>
            {appliedJobs.map((job) => (
              <Box key={job._id}>
                <JobListing
                  job={job}
                  openJobQuestionsDrawer={openJobQuestionsDrawer}
                  onApplyClick={onApplyClick}
                />
              </Box>
            ))}
          </Flex>
        ) : (
          <Flex p={4} direction="column">
            <Text>You haven&apos;t applied to any jobs yet.</Text>
          </Flex>
        )}
      </StyledSkeleton>
    </Flex>
  );
};

