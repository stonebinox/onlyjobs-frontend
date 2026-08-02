import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { OutOfCreditPreviewResponse } from "@/lib/apiClient";

interface Props {
  preview: OutOfCreditPreviewResponse | null;
}

function formatPostedDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export const OutOfCreditPreview = ({ preview }: Props) => {
  if (!preview || !preview.shouldShow) return null;

  const { count, candidates, walletBalance, onDemandMatchCost } = preview;
  const showOnDemandNote =
    walletBalance >= onDemandMatchCost && walletBalance < 0.3;

  return (
    <Box
      border="1px solid"
      borderColor="orange.200"
      borderRadius="xl"
      p={5}
      mb={5}
      bg="orange.50"
    >
      <Heading as="h3" size="sm" mb={2} color="orange.800">
        {count > 0
          ? `${count} unscored job${count === 1 ? "" : "s"} in your 15-day queue`
          : "Jobs in your 15-day queue"}
      </Heading>

      <Text fontSize="sm" color="orange.700" mb={3}>
        {count > 0
          ? `Automatic matching is paused. Based on your filters, ${count} ${
              count === 1 ? "job is" : "jobs are"
            } waiting to be scored. Once you top up, matching resumes.`
          : "Automatic matching is paused. No jobs in your queue match your current filters, but the queue refreshes daily."}
      </Text>

      {showOnDemandNote && (
        <Text fontSize="sm" color="orange.700" mb={3}>
          On-demand analysis is still available at ${onDemandMatchCost.toFixed(2)}/job — open any
          job listing in the dashboard to score it individually.
        </Text>
      )}

      {candidates.length > 0 && (
        <VStack align="start" spacing={2} mb={4}>
          {candidates.map((job, i) => (
            <Box key={i} p={3} bg="white" borderRadius="md" width="100%" border="1px solid" borderColor="orange.100">
              <Text fontWeight="medium" fontSize="sm" color="gray.800">
                {job.title}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {job.company}
                {job.location && job.location[0] ? ` · ${job.location[0]}` : ""}
                {" · posted "}
                {formatPostedDate(job.postedDate)}
              </Text>
            </Box>
          ))}
        </VStack>
      )}

      <NextLink href="/wallet">
        <Button size="sm" colorScheme="orange" variant="solid">
          Add funds
        </Button>
      </NextLink>
    </Box>
  );
};
