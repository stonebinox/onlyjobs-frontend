import {
  Box,
  Flex,
  Skeleton,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import styled from "styled-components";

import { useApi } from "@/hooks/useApi";
import { JobResult } from "@/types/JobResult";
import JobListing from "./JobListing";
import theme from "@/theme/theme";

const StyledSkeleton = styled(Skeleton)`
  width: 100%;
  height: auto;
  padding: 16px;
  border-radius: 8px;
`;

export const JobMatches = () => {
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [minScore, setMinScore] = useState<number>(65);
  const { getMatches } = useApi();

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

  useEffect(() => {
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minScore]);

  return (
    <Flex direction="column">
      <StyledSkeleton isLoaded={!loading}>
        <Box p={4}>
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Filter Matches by Score &bull; Viewing {jobs.length} jobs
          </Text>
          <Slider
            aria-label="match-score"
            onChangeEnd={(val) => setMinScore(val)}
            defaultValue={minScore}
          >
            <SliderMark
              value={minScore}
              textAlign={"center"}
              bg={theme.colors.brand[50]}
              color={theme.colors.brand[800]}
              borderRadius="md"
              mt="-10"
              ml="-5"
              w="12"
            >
              {minScore}%
            </SliderMark>
            <SliderTrack>
              <SliderFilledTrack bg={theme.colors.brand[900]} />
            </SliderTrack>
            <SliderThumb bg={theme.colors.brand[700]} />
          </Slider>
        </Box>
        <Flex direction="column" gap={4}>
          {jobs.map((job) => (
            <JobListing key={job._id} job={job} />
          ))}
        </Flex>
      </StyledSkeleton>
    </Flex>
  );
};
