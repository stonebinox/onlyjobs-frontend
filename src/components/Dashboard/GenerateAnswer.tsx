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
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { MdAutoAwesome } from "react-icons/md";
import { FaCopy } from "react-icons/fa";
import { useState, useEffect } from "react";

import { useApi } from "@/hooks/useApi";

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
  const [generatedAnswer, setGeneratedAnswer] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [qnaHistory, setQnaHistory] = useState<QnAItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const { createAnswer, getMatchQnAHistory } = useApi();

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

  const handleGenerateAnswer = async () => {
    if (question.trim() === "") return;

    const questionText = question.trim();
    try {
      setLoading(true);
      const response = await createAnswer(questionText, jobResultId);

      if (response?.success && response?.answer) {
        setGeneratedAnswer(response.answer);
        setCurrentQuestion(questionText);
        setQuestion("");
        
        // Refresh Q&A history after generating new answer
        if (jobResultId) {
          const historyResponse = await getMatchQnAHistory(jobResultId);
          if (historyResponse?.success && historyResponse?.qnaHistory) {
            setQnaHistory(historyResponse.qnaHistory);
          }
        }
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

  return (
    <VStack gap={4} mb={6} alignItems="flex-start">
      <Heading size="sm" fontWeight="semibold">Generate Answer</Heading>
      <Text size="md" color="gray.700">
        Paste a question here from any job application to generate an answer
        based on your profile. The AI will do its best to match your{" "}
        <i>style</i> of writing and maintain consistency with previous answers for this application.
      </Text>
      
      {/* Q&A History */}
      {qnaHistory.length > 0 && (
        <Box width="100%">
          <Text fontWeight="semibold" fontSize="sm" color="gray.600" mb={3}>
            Previous Q&A ({qnaHistory.length})
          </Text>
          <Box maxH="400px" overflowY="auto">
            <Accordion allowMultiple defaultIndex={[]}>
              {qnaHistory.map((item, index) => (
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
      <Skeleton isLoaded={!loading} width="100%">
        {generatedAnswer && (
          <VStack
            width="100%"
            bg="gray.50"
            p={4}
            borderRadius="md"
            alignItems="flex-start"
            spacing={3}
          >
            {currentQuestion && (
              <Box width="100%">
                <Text fontWeight="bold" fontSize="xs" color="gray.500" mb={1} textTransform="uppercase" letterSpacing="wide">
                  Question:
                </Text>
                <Text fontSize="sm" color="gray.700" fontStyle="italic">
                  {currentQuestion}
                </Text>
              </Box>
            )}
            <Box width="100%">
              <Text fontWeight="bold" fontSize="xs" color="gray.500" mb={2} textTransform="uppercase" letterSpacing="wide">
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
            <HStack width="100%" justifyContent="flex-end">
              <Tooltip label="Copy answer to clipboard" placement="auto" hasArrow>
                <IconButton
                  aria-label="copy"
                  icon={<FaCopy />}
                  size="sm"
                  variant="outline"
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
