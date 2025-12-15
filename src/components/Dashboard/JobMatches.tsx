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

import JobListing from "./JobListing";
import theme from "@/theme/theme";
import { JobResult } from "@/types/JobResult";

const StyledSkeleton = styled(Skeleton)`
  width: 100%;
  height: auto;
  padding: 16px;
  border-radius: 8px;
`;

interface JobMatchesProps {
  jobs: JobResult[];
  loading: boolean;
  fetchMatches: (minScore?: number) => void;
  openJobQuestionsDrawer: (jobResult: JobResult) => void;
  onApplyClick?: (jobResult: JobResult) => void;
}

export const JobMatches = ({
  jobs,
  loading,
  fetchMatches,
  openJobQuestionsDrawer,
  onApplyClick,
}: JobMatchesProps) => {
  const [minScore, setMinScore] = useState<number>(65);

  const unviewedJobs = jobs.filter((job) => !job.clicked && !job.skipped);

  useEffect(() => {
    fetchMatches(minScore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minScore]);

  return (
    <Flex direction="column">
      <StyledSkeleton isLoaded={!loading}>
        <Box p={4}>
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Filter Matches by Score &bull; Viewing {unviewedJobs.length} jobs
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
          {unviewedJobs.length === 0 && (
            <Flex p={4} direction="column">
              <Text>
                No new matches at the moment. Your profile is matched once every
                24 hours with jobs.
              </Text>
              <Text>
                Update your&nbsp;
                <strong>profile</strong>&nbsp;or&nbsp;
                <strong>answer some commonly asked interview questions</strong>
                &nbsp;to enhance your profile in the meantime.
              </Text>
            </Flex>
          )}
          {unviewedJobs.map((job) => (
            <JobListing
              key={job._id}
              job={job}
              openJobQuestionsDrawer={openJobQuestionsDrawer}
              onApplyClick={onApplyClick}
            />
          ))}
        </Flex>
      </StyledSkeleton>
    </Flex>
  );
};
