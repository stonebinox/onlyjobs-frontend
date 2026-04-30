import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Heading,
  HStack,
  IconButton,
  Input,
  Skeleton,
  Spinner,
  Text,
  Textarea,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { MdAutoAwesome, MdRefresh } from "react-icons/md";
import { FaCopy } from "react-icons/fa";
import { useState, useEffect } from "react";

import { createApiClient } from "@/lib/apiClient";

interface GenerateAnswerProps {
  jobResultId?: string;
}

interface QnAItem {
  _id: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

export const GenerateAnswer = ({ jobResultId }: GenerateAnswerProps) => {
  const [question, setQuestion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [regenerating, setRegenerating] = useState<boolean>(false);
  const [generatedAnswer, setGeneratedAnswer] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [qnaHistory, setQnaHistory] = useState<QnAItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [showCustomInstructions, setShowCustomInstructions] =
    useState<boolean>(false);
  const { createAnswer, getMatchQnAHistory } = createApiClient();

  // Reset state when jobResultId changes to avoid cross-job leakage
  useEffect(() => {
    setGeneratedAnswer(null);
    setCurrentQuestion(null);
    setQuestion("");
    setCustomInstructions("");
  }, [jobResultId]);

  // Fetch Q&A history when component loads or jobResultId changes
  useEffect(() => {
    if (jobResultId) {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
          const response = await getMatchQnAHistory(jobResultId);
          if (response?.success && response?.qnaHistory) {
            setQnaHistory(response.qnaHistory);
          }
        } catch (error) {
          console.error("Error fetching Q&A history:", error);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobResultId]);

  const refreshHistory = async () => {
    if (!jobResultId) return;
    try {
      const historyResponse = await getMatchQnAHistory(jobResultId);
      if (historyResponse?.success && historyResponse?.qnaHistory) {
        setQnaHistory(historyResponse.qnaHistory);
      }
    } catch (error) {
      console.error("Error refreshing Q&A history:", error);
    }
  };

  const handleGenerateAnswer = async () => {
    if (question.trim() === "") return;

    const questionText = question.trim();
    const instructions = customInstructions.trim() || undefined;
    try {
      setLoading(true);
      const response = await createAnswer(questionText, jobResultId, instructions);

      if (response?.success && response?.answer) {
        setGeneratedAnswer(response.answer);
        setCurrentQuestion(questionText);
        setQuestion("");
        await refreshHistory();
      } else {
        console.error("Failed to generate answer:", response);
        throw new Error("Failed to generate answer");
      }
    } catch (error) {
      console.error("Error generating answer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!currentQuestion) return;

    const instructions = customInstructions.trim() || undefined;
    try {
      setRegenerating(true);
      const response = await createAnswer(
        currentQuestion,
        jobResultId,
        instructions,
        true
      );

      if (response?.success && response?.answer) {
        setGeneratedAnswer(response.answer);
        await refreshHistory();
      } else {
        console.error("Failed to regenerate answer:", response);
      }
    } catch (error) {
      console.error("Error regenerating answer:", error);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <VStack gap={4} mb={6} alignItems="flex-start">
      <Heading size="sm" fontWeight="semibold">
        Generate Answer
      </Heading>
      <Text size="md" color="gray.700">
        Paste a question here from any job application to generate an answer
        based on your profile. The AI will do its best to match your{" "}
        <i>style</i> of writing and maintain consistency with previous answers
        for this application.
      </Text>

      {/* Q&A History */}
      {qnaHistory.length > 0 && (
        <Box width="100%">
          <Text fontWeight="semibold" fontSize="sm" color="gray.600" mb={3}>
            Previous Q&A ({qnaHistory.length})
          </Text>
          <Box maxH="400px" overflowY="auto">
            <Accordion allowMultiple defaultIndex={[]}>
              {qnaHistory.map((item) => (
                <AccordionItem
                  key={item._id}
                  borderWidth="1px"
                  borderRadius="md"
                  mb={2}
                  borderLeft="3px solid"
                  borderLeftColor="blue.300"
                >
                  <h2>
                    <AccordionButton py={2} px={3}>
                      <Box flex="1" textAlign="left">
                        <Text
                          fontSize="xs"
                          color="gray.700"
                          fontStyle="italic"
                          noOfLines={1}
                        >
                          {item.question}
                        </Text>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={3} px={3} bg="gray.50">
                    <VStack spacing={2} alignItems="flex-start">
                      <Box width="100%">
                        <Text
                          fontWeight="bold"
                          fontSize="xs"
                          color="gray.500"
                          mb={1}
                          textTransform="uppercase"
                          letterSpacing="wide"
                        >
                          Question:
                        </Text>
                        <Text fontSize="xs" color="gray.700" fontStyle="italic">
                          {item.question}
                        </Text>
                      </Box>
                      <Box width="100%">
                        <Text
                          fontWeight="bold"
                          fontSize="xs"
                          color="gray.500"
                          mb={1}
                          textTransform="uppercase"
                          letterSpacing="wide"
                        >
                          Answer:
                        </Text>
                        <Text
                          fontSize="xs"
                          color="gray.800"
                          whiteSpace="pre-wrap"
                          lineHeight="1.5"
                        >
                          {item.answer}
                        </Text>
                      </Box>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </Box>
        </Box>
      )}

      <VStack width="100%" alignItems="flex-start" gap={2}>
        <HStack gap={4} width="100%">
          <Input
            type="text"
            placeholder="Paste your question here"
            onChange={(e) => setQuestion(e.target.value)}
            isDisabled={loading}
            value={question}
          />
          <Button
            variant="outline"
            colorScheme="blue"
            onClick={handleGenerateAnswer}
            leftIcon={<MdAutoAwesome />}
            isLoading={loading}
            loadingText="Generating..."
            size="md"
            isDisabled={loading}
          >
            Generate
          </Button>
        </HStack>
        <Button
          variant="link"
          size="xs"
          color="gray.500"
          onClick={() => setShowCustomInstructions((v) => !v)}
        >
          {showCustomInstructions
            ? "- Hide custom instructions"
            : "+ Add custom instructions"}
        </Button>
        {showCustomInstructions && (
          <Textarea
            placeholder='e.g. "keep it under 100 words", "emphasise startup experience", "make it casual"'
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            size="sm"
            rows={3}
            isDisabled={loading || regenerating}
          />
        )}
      </VStack>

      <Skeleton isLoaded={!loading} width="100%">
        {generatedAnswer && (
          <VStack
            width="100%"
            bg="gray.50"
            p={4}
            borderRadius="md"
            alignItems="flex-start"
            spacing={3}
            position="relative"
          >
            {currentQuestion && (
              <Box width="100%">
                <Text
                  fontWeight="bold"
                  fontSize="xs"
                  color="gray.500"
                  mb={1}
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  Question:
                </Text>
                <Text fontSize="sm" color="gray.700" fontStyle="italic">
                  {currentQuestion}
                </Text>
              </Box>
            )}
            <Box
              width="100%"
              opacity={regenerating ? 0.4 : 1}
              transition="opacity 0.2s"
            >
              <Text
                fontWeight="bold"
                fontSize="xs"
                color="gray.500"
                mb={2}
                textTransform="uppercase"
                letterSpacing="wide"
              >
                Generated Answer:
              </Text>
              <Text
                whiteSpace="pre-wrap"
                fontSize="sm"
                color="gray.800"
                lineHeight="1.6"
              >
                {generatedAnswer}
              </Text>
            </Box>
            {regenerating && (
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
              >
                <Spinner size="md" color="blue.500" />
              </Box>
            )}
            <HStack width="100%" justifyContent="flex-end">
              <Tooltip label="Get a new variation" placement="auto" hasArrow>
                <IconButton
                  aria-label="regenerate"
                  icon={<MdRefresh />}
                  size="sm"
                  variant="outline"
                  onClick={handleRegenerate}
                  isLoading={regenerating}
                  isDisabled={regenerating || loading}
                />
              </Tooltip>
              <Tooltip label="Copy answer to clipboard" placement="auto" hasArrow>
                <IconButton
                  aria-label="copy"
                  icon={<FaCopy />}
                  size="sm"
                  variant="outline"
                  isDisabled={regenerating}
                  onClick={() => {
                    navigator.clipboard.writeText(generatedAnswer || "");
                  }}
                />
              </Tooltip>
            </HStack>
          </VStack>
        )}
      </Skeleton>
    </VStack>
  );
};
