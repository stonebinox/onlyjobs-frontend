import { Flex, Skeleton } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import styled from "styled-components";

import { useApi } from "@/hooks/useApi";
import { JobResult } from "@/types/JobResult";
import JobListing from "./JobListing";

const StyledSkeleton = styled(Skeleton)`
  width: 100%;
  height: auto;
  padding: 16px;
`;

export const JobMatches = () => {
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [minScore, setMinScore] = useState<number>(0);
  const { getMatches } = useApi();

  useEffect(() => {
    if (jobs.length !== 0) return;

    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await getMatches(minScore);

        if (response.error) {
          console.error("Error fetching matches:", response.error);
        } else {
          setJobs(response);
        }
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs.length]);

  return (
    <Flex direction="column" gap={4}>
      <StyledSkeleton isLoaded={!loading} />
      {jobs.map((job) => (
        <JobListing key={job._id} job={job} />
      ))}
    </Flex>
  );
};
