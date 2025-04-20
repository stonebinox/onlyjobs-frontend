import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Text,
  Badge,
  VStack,
  Heading,
  Divider,
  HStack,
} from "@chakra-ui/react";
import { FiEdit, FiMic } from "react-icons/fi";
import { AnsweredQuestion } from "@/types/AnsweredQuestion";

interface AnsweredQuestionsProps {
  answeredQuestions: AnsweredQuestion[];
}

export const AnsweredQuestions = ({
  answeredQuestions,
}: AnsweredQuestionsProps) => {
  if (answeredQuestions.length === 0) {
    return (
      <Box py={4} textAlign="center" mt={4}>
        <Heading size="md" mb={2}>
          Your Previous Answers
        </Heading>
        <Text color="gray.500">No answered questions yet.</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch" mt={4}>
      <Heading size="md" mb={2}>
        Your Previous Answers
      </Heading>
      <Accordion allowMultiple defaultIndex={[]}>
        {answeredQuestions.map((item, index) => (
          <AccordionItem
            key={item.id}
            borderWidth="1px"
            borderRadius="md"
            mb={2}
          >
            <h2>
              <AccordionButton py={3}>
                <Box flex="1" textAlign="left" fontWeight="medium">
                  {item.question}
                </Box>
                <HStack spacing={2} mr={2}>
                  <Badge
                    colorScheme={item.mode === "text" ? "blue" : "purple"}
                    variant="subtle"
                  >
                    {item.mode === "text" ? (
                      <HStack spacing={1}>
                        <FiEdit size="12px" />
                        <Text fontSize="xs">Text</Text>
                      </HStack>
                    ) : (
                      <HStack spacing={1}>
                        <FiMic size="12px" />
                        <Text fontSize="xs">Voice</Text>
                      </HStack>
                    )}
                  </Badge>
                </HStack>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} bg="gray.50">
              <VStack align="start" spacing={2}>
                <Text fontWeight="bold" fontSize="sm" color="gray.600">
                  Your Answer:
                </Text>
                <Text>{item.answer}</Text>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </VStack>
  );
};
