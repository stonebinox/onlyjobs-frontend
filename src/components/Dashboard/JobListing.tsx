import {
  Box,
  Badge,
  Heading,
  Text,
  HStack,
  VStack,
  Flex,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiMapPin, FiClock, FiBriefcase, FiDollarSign } from "react-icons/fi";

export interface JobListingProps {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  description: string;
  postedDate: string;
  applicants: number;
  isHot?: boolean;
}

const JobListing = ({
  title,
  company,
  location,
  salary,
  type,
  description,
  postedDate,
  applicants,
  isHot = false,
}: JobListingProps) => {
  return (
    <Box
      p={5}
      shadow="md"
      borderWidth="1px"
      borderRadius="lg"
      bg={useColorModeValue("white", "gray.700")}
      position="relative"
      overflow="hidden"
    >
      {isHot && (
        <Badge colorScheme="red" position="absolute" top={2} right={2}>
          Hot Job
        </Badge>
      )}

      <Flex direction={{ base: "column", md: "row" }} justify="space-between">
        <VStack align="start" spacing={2}>
          <Heading as="h3" size="md">
            {title}
          </Heading>
          <Text fontWeight="bold" color="gray.500">
            {company}
          </Text>

          <HStack spacing={4} mt={2}>
            <HStack>
              <FiMapPin />
              <Text fontSize="sm">{location}</Text>
            </HStack>

            <HStack>
              <FiBriefcase />
              <Text fontSize="sm">{type}</Text>
            </HStack>

            <HStack>
              <FiDollarSign />
              <Text fontSize="sm">{salary}</Text>
            </HStack>
          </HStack>

          <Text noOfLines={2} color="gray.600" mt={2}>
            {description}
          </Text>
        </VStack>
      </Flex>

      <Flex justify="space-between" align="center" mt={4}>
        <HStack>
          <FiClock />
          <Text fontSize="xs">
            Posted {postedDate} • {applicants} applicants
          </Text>
        </HStack>

        <HStack>
          <Button size="sm" variant="outline">
            View Details
          </Button>
          <Button size="sm" colorScheme="blue">
            Apply
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
};

export default JobListing;
