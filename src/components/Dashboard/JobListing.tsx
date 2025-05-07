import {
  Box,
  Badge,
  Heading,
  Text,
  HStack,
  VStack,
  Flex,
  Button,
  Tooltip,
} from "@chakra-ui/react";
import { Fragment, useState } from "react";
import {
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiTag,
  FiGlobe,
  FiTarget,
  FiCheckCircle,
  FiThumbsUp,
  FiAlertCircle,
  FiXCircle,
  FiExternalLink,
  FiCpu,
} from "react-icons/fi";

import { useApi } from "@/hooks/useApi";
import { JobResult } from "@/types/JobResult";
import { Salary } from "@/types/Salary";
import { formatDate } from "@/utils/date-formatter";
import { numberFormatter } from "@/utils/text-formatter";

export interface JobListingProps {
  job: JobResult;
  bypassSkippedFiltering?: boolean;
}

const JobListing = ({
  job,
  bypassSkippedFiltering = false,
}: JobListingProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [viewed, setViewed] = useState<boolean>(false);
  const [skippedLocally, setSkippedLocally] = useState<boolean>(false);
  const { markMatchClick, markMatchAsSkipped } = useApi();

  if (!job.job) return <></>;

  if ((job.skipped || skippedLocally) && !bypassSkippedFiltering) return <></>;

  const {
    matchScore,
    verdict,
    reasoning,
    _id: matchId,
    clicked,
    job: {
      title,
      company,
      location,
      salary,
      tags,
      source,
      description,
      postedDate,
      url,
    },
  } = job;

  const skipMatch = async (matchId: string) => {
    setSkippedLocally(true);
    await markMatchAsSkipped(matchId);
  };

  const getSalaryString = (salary: Salary) => {
    if (salary.min && salary.max) {
      return `${salary.currency} ${numberFormatter(
        salary.min
      )} - ${numberFormatter(salary.max)} per year ${
        salary.estimated ? "(estimated)" : ""
      }`;
    } else if (salary.min) {
      return `${salary.currency} ${numberFormatter(salary.min)}+ per year ${
        salary.estimated ? "(estimated)" : ""
      }`;
    } else if (salary.max) {
      return `Max ${salary.currency} ${numberFormatter(salary.max)} per year ${
        salary.estimated ? "(estimated)" : ""
      }`;
    }

    return "Not specified";
  };

  const formatDescription = (description: string) => {
    const lines = description.split("\n");

    return lines.map((line, index) => (
      <Fragment key={index}>
        <span>{line}</span>
        <br />
      </Fragment>
    ));
  };

  const handleApplyClick = async () => {
    window.open(url, "_blank");
    setViewed(true);
    await markMatchClick(matchId);
  };

  const getListingFreshness = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return `Fresh`;
    } else if (diffDays < 14) {
      return `Warm`;
    } else {
      return `Stale`;
    }
  };

  return (
    <Box
      p={5}
      shadow="md"
      borderWidth="1px"
      borderRadius="lg"
      bg={job.skipped ? "gray.200" : "white"}
      position="relative"
      overflow="hidden"
    >
      <Flex direction={{ base: "column", md: "row" }} justify="space-between">
        <VStack align="start" spacing={2}>
          <HStack gap={4}>
            <Heading as="h3" size="md">
              {title}
            </Heading>
            <Tooltip
              label={`AI opinion: ${reasoning}`}
              placement="auto"
              hasArrow
            >
              <Box
                px={4}
                py={2}
                borderRadius="md"
                width="auto"
                bg={
                  verdict === "Strong match"
                    ? "green.500"
                    : verdict === "Mild match"
                    ? "blue.500"
                    : verdict === "Weak match"
                    ? "orange.500"
                    : "red.500"
                }
                color={"white"}
              >
                <Flex justifyContent="space-between" alignItems="center">
                  <HStack spacing={2}>
                    {verdict === "Strong match" ? (
                      <FiCheckCircle />
                    ) : verdict === "Mild match" ? (
                      <FiThumbsUp />
                    ) : verdict === "Weak match" ? (
                      <FiAlertCircle />
                    ) : (
                      <FiXCircle />
                    )}
                    <Text fontWeight="bold">{verdict}</Text>
                    <FiCpu />
                  </HStack>
                </Flex>
              </Box>
            </Tooltip>
          </HStack>
          <Text fontWeight="bold" color="gray.500">
            {company}
          </Text>
          <HStack spacing={4} mt={2}>
            <HStack>
              <FiMapPin />
              <Text fontSize="sm">{location.join(", ")}</Text>
            </HStack>
            <HStack>
              <FiTag />
              <Text fontSize="sm">{tags.join(", ")}</Text>
            </HStack>
            <HStack>
              <FiDollarSign />
              <Text fontSize="sm">{getSalaryString(salary)}</Text>
            </HStack>
            <HStack>
              <FiTarget />
              <Text fontSize="sm" fontWeight={"bold"}>
                {matchScore}% match
              </Text>
            </HStack>
            <HStack>
              <FiGlobe />
              <Text fontSize="sm">{source}</Text>
            </HStack>
          </HStack>
          <Text noOfLines={isExpanded ? undefined : 2} color="gray.600" mt={2}>
            {formatDescription(description)}
          </Text>
        </VStack>
      </Flex>
      <Flex justify="space-between" align="center" mt={4}>
        <HStack>
          <FiClock />
          <Text fontSize="xs">Posted {formatDate(new Date(postedDate))}</Text>
          <Tooltip
            label={
              getListingFreshness(new Date(postedDate)) === "Fresh"
                ? "Posted less than a week ago"
                : getListingFreshness(new Date(postedDate)) === "Warm"
                ? "Posted 1-2 weeks ago"
                : "Posted more than 2 weeks ago"
            }
            placement="top"
            hasArrow
          >
            <Badge
              colorScheme={
                getListingFreshness(new Date(postedDate)) === "Fresh"
                  ? "green"
                  : getListingFreshness(new Date(postedDate)) === "Warm"
                  ? "orange"
                  : "gray"
              }
              fontSize={"xs"}
            >
              {getListingFreshness(new Date(postedDate))}
            </Badge>
          </Tooltip>
        </HStack>
        <HStack>
          {(clicked || viewed || job.skipped) && (
            <Badge
              colorScheme={job.skipped ? "orange" : "green"}
              fontSize={"sm"}
            >
              {job.skipped ? "Skipped" : "Visited"} on:{" "}
              {formatDate(new Date(job.updatedAt))}
            </Badge>
          )}
          {!job.skipped && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => skipMatch(matchId)}
            >
              Skip
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show Less" : "Show More"}
          </Button>
          <Button
            size="sm"
            colorScheme="blue"
            onClick={handleApplyClick}
            gap={2}
          >
            <FiExternalLink />
            Apply
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
};

export default JobListing;
