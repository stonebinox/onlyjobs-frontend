import {
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
import { useState } from "react";

import { useApi } from "@/hooks/useApi";

interface GenerateAnswerProps {
  jobResultId?: string;
}

export const GenerateAnswer = ({ jobResultId }: GenerateAnswerProps) => {
  const [question, setQuestion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedAnswer, setGeneratedAnswer] = useState<string | null>(null);
  const { createAnswer } = useApi();

  const handleGenerateAnswer = async () => {
    if (question.trim() === "") return;

    try {
      setLoading(true);
      const response = await createAnswer(question, jobResultId);

      if (response?.success && response?.answer) {
        setGeneratedAnswer(response.answer);
        setQuestion("");
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
        <i>style</i> of writing. For best results, be sure to answer some of its
        existing questions first by clicking on &quot;Start Conversation&quot;
        above.
      </Text>
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
          >
            <Text fontWeight="bold" fontSize="sm" color="gray.600">
              Generated Answer:
            </Text>
            <Text>{generatedAnswer}</Text>
            <Tooltip label="Copy to clipboard" placement="auto" hasArrow>
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
          </VStack>
        )}
      </Skeleton>
    </VStack>
  );
};
