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
  openJobQuestionsDrawer: (jobResult: JobResult) => void;
  onApplyClick?: (jobResult: JobResult) => void;
}

const JobListing = ({
  job,
  bypassSkippedFiltering = false,
  openJobQuestionsDrawer,
  onApplyClick,
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
    // Notify parent component about the Apply click
    if (onApplyClick) {
      onApplyClick(job);
    }
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
      p={{ base: 3, md: 5 }}
      shadow="md"
      borderWidth="1px"
      borderRadius="lg"
      bg={job.skipped ? "gray.200" : "white"}
      position="relative"
      overflow="hidden"
      maxW="100%"
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        gap={{ base: 2, md: 0 }}
      >
        <VStack align="start" spacing={2} w="100%">
          <HStack
            gap={2}
            flexWrap="wrap"
            alignItems="flex-start"
            justifyContent="space-between"
            w="100%"
          >
            <Heading as="h3" size={{ base: "sm", md: "md" }} noOfLines={2}>
              {title}
            </Heading>
            <HStack spacing={2} alignItems="center">
              <Button
                size={{ base: "xs", md: "sm" }}
                variant="outline"
                onClick={() => openJobQuestionsDrawer(job)}
              >
                Get Application Help
              </Button>
              <Box
                px={{ base: 2, md: 4 }}
                py={{ base: 1, md: 2 }}
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
                fontSize={{ base: "xs", md: "sm" }}
                mt={{ base: 1, md: 0 }}
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
            </HStack>
          </HStack>
          <Text
            fontWeight="bold"
            color="gray.500"
            fontSize={{ base: "sm", md: "md" }}
          >
            {company}
          </Text>
          {/* responsive vertical stack for job meta info */}
          <Flex
            direction={{ base: "column", sm: "row" }}
            gap={{ base: 2, md: 4 }}
            wrap="wrap"
            mt={2}
            w="100%"
            align={{ base: "start", sm: "center" }}
            fontSize={{ base: "xs", md: "sm" }}
          >
            <HStack minW="150px">
              <FiMapPin />
              <Text>{location.join(", ")}</Text>
            </HStack>
            <HStack minW="120px">
              <FiTag />
              <Text>{tags.join(", ")}</Text>
            </HStack>
            <HStack minW="120px">
              <FiDollarSign />
              <Text>{getSalaryString(salary)}</Text>
            </HStack>
            <HStack minW="110px">
              <FiTarget />
              <Text fontWeight={"bold"}>{matchScore}% match</Text>
            </HStack>
            <HStack minW="100px">
              <FiGlobe />
              <Text>{source}</Text>
            </HStack>
          </Flex>
          {/* AI Reasoning Box */}
          <Box
            mt={2}
            px={3}
            py={2}
            borderRadius="md"
            bg="blue.50"
            border="1px solid"
            borderColor="blue.200"
            color="blue.800"
            fontSize={{ base: "xs", md: "sm" }}
            display="flex"
            alignItems="flex-start"
            gap={2}
            w="100%"
          >
            <Box w="100%">
              <Text fontWeight="bold" mb={1}>
                AI Reasoning
              </Text>
              <Text>{reasoning}</Text>
            </Box>
          </Box>
          <Text
            noOfLines={isExpanded ? undefined : { base: 3, md: 2 }}
            color="gray.600"
            mt={2}
            fontSize={{ base: "sm", md: "md" }}
            w="100%"
          >
            {formatDescription(description)}
          </Text>
        </VStack>
      </Flex>
      <Flex
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        align={{ base: "stretch", sm: "center" }}
        mt={4}
        gap={{ base: 2, sm: 0 }}
      >
        <HStack spacing={2} mb={{ base: 2, sm: 0 }}>
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
              fontSize={{ base: "xx-small", md: "xs" }}
            >
              {getListingFreshness(new Date(postedDate))}
            </Badge>
          </Tooltip>
        </HStack>
        <HStack spacing={2}>
          {(clicked || viewed || job.skipped) && (
            <Badge
              colorScheme={job.skipped ? "orange" : "green"}
              fontSize={{ base: "xs", md: "sm" }}
              whiteSpace="pre-wrap"
              textAlign="center"
            >
              {job.skipped ? "Skipped" : "Visited"} on:{" "}
              {formatDate(new Date(job.updatedAt))}
            </Badge>
          )}
          {!job.skipped && (
            <Button
              size={{ base: "xs", md: "sm" }}
              variant="outline"
              onClick={() => skipMatch(matchId)}
            >
              Skip
            </Button>
          )}
          <Button
            size={{ base: "xs", md: "sm" }}
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show Less" : "Show More"}
          </Button>
          <Button
            size={{ base: "xs", md: "sm" }}
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
