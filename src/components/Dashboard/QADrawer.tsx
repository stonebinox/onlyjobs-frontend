import {
  Alert,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  Skeleton,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { useApi } from "@/hooks/useApi";
import theme from "@/theme/theme";
import { Question } from "@/types/Question";
import { FiEdit, FiMessageCircle, FiMic } from "react-icons/fi";

interface QADrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QADrawer = ({ isOpen, onClose }: QADrawerProps) => {
  const { getQuestion } = useApi();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [textAnswer, setTextAnswer] = useState<string>("");

  const startConversationClick = async () => {
    try {
      setIsLoading(true);
      const response = await getQuestion();
      setCurrentQuestion(JSON.parse(response));
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAll = () => {
    setCurrentQuestion(null);
    setIsLoading(false);
    setIsTyping(false);
    setIsSpeaking(false);
  };

  useEffect(() => {
    if (isTyping) {
      setIsSpeaking(false);
    }
  }, [isTyping]);

  useEffect(() => {
    if (isSpeaking) {
      setIsTyping(false);
    }
  }, [isSpeaking]);

  useEffect(() => {
    if (!isOpen) {
      resetAll();
    }
  }, [isOpen]);

  return (
    <Drawer placement="right" size="lg" isOpen={isOpen} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Let&apos;s improve your profile</DrawerHeader>
        <DrawerBody>
          <Text fontSize="md" mb={4}>
            This section focuses on improving your profile and matching rate
            based on your past experiences and work culture preferences. You
            will be asked common interview questions and you can answer them in
            a conversational manner. The AI model will help you refine your
            answers and provide suggestions to improve them.
          </Text>
          <Alert status="info" variant="left-accent" borderRadius="md" mb={4}>
            <AlertIcon />
            <Box>
              <AlertTitle fontWeight="bold">Note</AlertTitle>
              <Text fontSize="md" mb={2}>
                This section is primarily driven with an AI model to ease you
                into the process. It also ensures that you cover a lot of ground
                efficiently.
              </Text>
              <Text fontSize="sm" color={theme.colors.brand[500]}>
                You can revisit this section whenever you want to update your
                answers.
              </Text>
            </Box>
          </Alert>
          <Divider />
          <Skeleton isLoaded={!isLoading}>
            {!currentQuestion && (
              <Button
                size="lg"
                colorScheme="blue"
                mt={4}
                mb={4}
                width="100%"
                onClick={startConversationClick}
                leftIcon={<FiMessageCircle />}
              >
                Start conversation
              </Button>
            )}
            {currentQuestion && (
              <>
                <Text fontSize="md" mt={4} mb={4}>
                  <strong>Question: </strong>
                  {currentQuestion.question}
                </Text>
                {!isTyping && !isSpeaking && (
                  <>
                    <HStack width={"100%"} justifyContent="space-between">
                      <Button
                        size="md"
                        colorScheme="blue"
                        mt={4}
                        mb={4}
                        width="100%"
                        onClick={() => setIsTyping(true)}
                        leftIcon={<FiEdit />}
                        variant="outline"
                      >
                        Type an answer
                      </Button>
                      <Button
                        size="md"
                        colorScheme="blue"
                        mt={4}
                        mb={4}
                        width="100%"
                        onClick={() => setIsSpeaking(true)}
                        leftIcon={<FiMic />}
                        variant="outline"
                      >
                        Talk
                      </Button>
                    </HStack>
                    <Text
                      fontSize="sm"
                      color={theme.colors.brand[500]}
                      textAlign={"center"}
                    >
                      Your answers will be auto-refined by AI. Don't worry about
                      your accent or grammar.
                    </Text>
                  </>
                )}
                {isTyping && (
                  <>
                    <Textarea
                      placeholder="Type your answer here..."
                      size="lg"
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      mt={4}
                      mb={4}
                      resize="none"
                      minHeight="200px"
                      maxHeight="300px"
                      borderColor={theme.colors.brand[500]}
                      _focus={{
                        borderColor: theme.colors.brand[500],
                        boxShadow: `0 0 0 1px ${theme.colors.brand[500]}`,
                      }}
                      _placeholder={{
                        color: theme.colors.gray[500],
                        fontStyle: "italic",
                      }}
                    />
                    <Button
                      size="md"
                      colorScheme="blue"
                      mt={4}
                      width="100%"
                      onClick={() => {
                        setIsTyping(false);
                        setTextAnswer("");
                      }}
                      leftIcon={<FiEdit />}
                    >
                      Submit answer
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      mt={4}
                      mb={4}
                      width="100%"
                      onClick={() => {
                        setIsSpeaking(true);
                        setTextAnswer("");
                      }}
                      leftIcon={<FiMic />}
                      variant="link"
                    >
                      Switch to voice
                    </Button>
                  </>
                )}
              </>
            )}
          </Skeleton>
        </DrawerBody>
        <DrawerFooter>
          <Button size="sm" variant="outline">
            Skip
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
