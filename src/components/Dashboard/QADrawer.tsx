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
  DrawerHeader,
  DrawerOverlay,
  HStack,
  IconButton,
  Skeleton,
  Text,
  Textarea,
  Tooltip,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  FiEdit,
  FiMessageCircle,
  FiMic,
  FiSend,
  FiSquare,
  FiX,
} from "react-icons/fi";

import { useApi } from "@/hooks/useApi";
import theme from "@/theme/theme";
import { Question } from "@/types/Question";
import { AnsweredQuestion } from "@/types/AnsweredQuestion";
import { AnsweredQuestions } from "./AnsweredQuestions";

interface QADrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QADrawer = ({ isOpen, onClose }: QADrawerProps) => {
  const { getQuestion, postAnswer, uploadAudio, getAnsweredQuestions } =
    useApi();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [answersLoading, setAnswersLoading] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [textAnswer, setTextAnswer] = useState<string>("");
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<
    AnsweredQuestion[]
  >([]);

  const startConversationClick = async () => {
    try {
      setIsLoading(true);
      setIsTyping(false);
      setIsSpeaking(false);
      const response = await getQuestion();
      setCurrentQuestion(JSON.parse(response));
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitTypedAnswer = async () => {
    if (textAnswer.trim() === "" || !currentQuestion) return;

    setAnswerError(null);
    const mode = "text";

    try {
      setIsLoading(true);
      const response = await postAnswer(
        textAnswer,
        currentQuestion.questionId,
        mode
      );

      if (response.success) {
        setCurrentQuestion(null);
        setTextAnswer("");
        await startConversationClick();
      } else {
        setAnswerError(response.message);
      }
    } catch (error) {
      console.error("Error posting answer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    if (!currentQuestion) return;

    setAudioError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setIsRecording(false);
        // Stop all audio tracks
        stream.getAudioTracks().forEach((track) => track.stop());
      };

      recorder.start();

      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setAudioError(
        "Could not access microphone. Please ensure you've granted permission."
      );
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setAudioBlob(null);
      setAudioError("Recording cancelled.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const submitAudioAnswer = async () => {
    if (!audioBlob || !currentQuestion || isRecording) return;

    setAnswerError(null);

    try {
      setIsLoading(true);

      // Convert the Blob to a File object
      const audioFile = new File([audioBlob], "recording.webm", {
        type: "audio/webm",
      });

      // Use the uploadAudio function to upload the audio file
      const uploadResponse = await uploadAudio(
        audioFile,
        currentQuestion.questionId
      );

      if (uploadResponse.error) {
        setAnswerError(uploadResponse.error);
        return;
      }

      if (uploadResponse.success) {
        setCurrentQuestion(null);
        setAudioBlob(null);
        await startConversationClick();
      } else {
        setAnswerError(
          uploadResponse.message || "Failed to process your answer"
        );
      }
    } catch (error) {
      console.error("Error submitting audio answer:", error);
      setAnswerError("Error submitting audio response.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnsweredQuestions = async () => {
    try {
      setAnswersLoading(true);
      const response = await getAnsweredQuestions();
      setAnsweredQuestions(response);
    } catch (error) {
      console.error("Error fetching answered questions:", error);
    } finally {
      setAnswersLoading(false);
    }
  };

  const changeCurrentQuestion = (
    questionId: string,
    question: string,
    answer: string = ""
  ) => {
    setCurrentQuestion({
      questionId,
      question,
    });

    setTextAnswer(answer);
    setIsTyping(false);
    setIsSpeaking(false);
  };

  const resetAll = () => {
    setCurrentQuestion(null);
    setIsLoading(false);
    setIsTyping(false);
    setIsSpeaking(false);
    setTextAnswer("");
    setAnswerError(null);
    setAudioError(null);
    setMediaRecorder(null);
    setAudioBlob(null);
    setIsRecording(false);
    setAnsweredQuestions([]);
    setAnswersLoading(false);
  };

  useEffect(() => {
    if (!currentQuestion) return;

    fetchAnsweredQuestions();
  }, [currentQuestion]);

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
    } else {
      fetchAnsweredQuestions();
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
                      mb={4}
                    >
                      Your answers will be auto-refined by AI. Don't worry about
                      your accent or grammar.
                    </Text>
                  </>
                )}
                {isTyping && (
                  <>
                    {answerError && (
                      <Alert
                        status="error"
                        variant="left-accent"
                        borderRadius="md"
                        mb={4}
                      >
                        <AlertIcon />
                        <Box>
                          <AlertTitle fontWeight="bold">Error</AlertTitle>
                          <Text fontSize="md" mb={2}>
                            {answerError}
                          </Text>
                        </Box>
                      </Alert>
                    )}
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
                      onClick={submitTypedAnswer}
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
                {isSpeaking && (
                  <>
                    <HStack
                      width={"100%"}
                      justifyContent="center"
                      mb={4}
                      mt={4}
                    >
                      <Tooltip
                        hasArrow
                        placement="auto"
                        label={
                          isRecording ? "Stop recording" : "Start recording"
                        }
                      >
                        <IconButton
                          icon={isRecording ? <FiSquare /> : <FiMic />}
                          variant="outline"
                          size="lg"
                          rounded="full"
                          width={"100px"}
                          height={"100px"}
                          fontSize="2xl"
                          aria-label="Start talking"
                          onClick={isRecording ? stopRecording : startRecording}
                        />
                      </Tooltip>
                    </HStack>
                    {isRecording && (
                      <Button
                        size="xs"
                        color="orange.300"
                        width="100%"
                        onClick={cancelRecording}
                        leftIcon={<FiX />}
                        variant="link"
                      >
                        Cancel recording
                      </Button>
                    )}
                    <Button
                      size="md"
                      colorScheme="blue"
                      mt={4}
                      width="100%"
                      onClick={submitAudioAnswer}
                      leftIcon={<FiSend />}
                      disabled={
                        audioError !== null || !audioBlob || isRecording
                      }
                    >
                      Submit audio
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      mt={4}
                      mb={4}
                      width="100%"
                      onClick={() => {
                        setIsTyping(true);
                        setTextAnswer("");
                      }}
                      leftIcon={<FiEdit />}
                      variant="link"
                    >
                      Switch to text
                    </Button>
                  </>
                )}
              </>
            )}
          </Skeleton>
          <Divider />
          <Skeleton isLoaded={!answersLoading}>
            <AnsweredQuestions
              answeredQuestions={answeredQuestions}
              changeCurrentQuestion={changeCurrentQuestion}
            />
          </Skeleton>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};
