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
  VStack,
  Badge,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useEffect, useState } from "react";
import {
  FiArrowRight,
  FiEdit,
  FiMessageCircle,
  FiMic,
  FiSend,
  FiSquare,
  FiX,
} from "react-icons/fi";
import { TbSparkles } from "react-icons/tb";

import { useApi } from "@/hooks/useApi";
import { Question } from "@/types/Question";
import { AnsweredQuestion } from "@/types/AnsweredQuestion";
import { AnsweredQuestions } from "./AnsweredQuestions";

interface QADrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
`;

const recordingPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
`;

export const QADrawer = ({ isOpen, onClose }: QADrawerProps) => {
  const {
    getQuestion,
    postAnswer,
    uploadAudio,
    getAnsweredQuestions,
    skipQuestion,
  } = useApi();
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

      const parsedQuestion = JSON.parse(response);

      if (!parsedQuestion.questionId) {
        setCurrentQuestion(null);
        setAnswerError("No more questions available at the moment.");
        return;
      }

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

  const skipQuestionClick = async () => {
    if (!currentQuestion) return;

    setAnswerError(null);

    try {
      setIsLoading(true);
      const response = await skipQuestion(currentQuestion.questionId);

      if (response.success) {
        setCurrentQuestion(null);
        await startConversationClick();
      } else {
        setAnswerError(response.message);
      }
    } catch (error) {
      console.error("Error skipping question:", error);
    } finally {
      setIsLoading(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <Drawer placement="right" size="xl" isOpen={isOpen} onClose={onClose}>
      <DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <DrawerContent borderLeftRadius="2xl">
        <DrawerCloseButton />

        {/* Header with gradient background */}
        <DrawerHeader
          bgGradient="linear(135deg, #F5F3FF 0%, #FDF2F8 50%, #FFF7ED 100%)"
          borderBottom="1px solid"
          borderColor="primary.100"
          py={6}
        >
          <HStack spacing={3}>
            <Box
              p={2}
              borderRadius="lg"
              bgGradient="linear(135deg, primary.500, secondary.500)"
              color="white"
            >
              <TbSparkles size={20} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontFamily="heading" fontWeight="bold" fontSize="lg">
                Interview Prep Q&A
              </Text>
              <Text fontSize="xs" color="text.tertiary" fontWeight="medium">
                AI-powered profile improvement
              </Text>
            </VStack>
          </HStack>
        </DrawerHeader>

        <DrawerBody py={6}>
          <Text fontSize="sm" color="text.secondary" mb={4} lineHeight="relaxed">
            Answer common interview questions to improve your profile and matching rate.
            The AI will help refine your answers and provide suggestions.
          </Text>

          <Alert
            status="info"
            borderRadius="xl"
            mb={6}
            bg="primary.50"
            border="1px solid"
            borderColor="primary.200"
          >
            <AlertIcon color="primary.500" />
            <Box>
              <AlertTitle fontWeight="bold" fontSize="sm">AI-Powered</AlertTitle>
              <Text fontSize="xs" color="text.secondary">
                Don&apos;t worry about grammar or accent — your answers will be auto-refined.
              </Text>
            </Box>
          </Alert>

          <Divider mb={6} />

          <Skeleton isLoaded={!isLoading} borderRadius="xl">
            {!currentQuestion && (
              <Button
                size="lg"
                width="100%"
                mb={6}
                onClick={startConversationClick}
                leftIcon={<FiMessageCircle />}
                bgGradient="linear(135deg, primary.500, secondary.500)"
                color="white"
                borderRadius="xl"
                _hover={{
                  bgGradient: "linear(135deg, primary.600, secondary.600)",
                  transform: "translateY(-1px)",
                  boxShadow: "button",
                }}
              >
                Start conversation
              </Button>
            )}

            {currentQuestion && (
              <VStack spacing={4} align="stretch">
                {/* Question Card */}
                <Box
                  p={5}
                  borderRadius="xl"
                  bg="surface.card"
                  border="2px solid"
                  borderColor="primary.200"
                  boxShadow="card"
                >
                  <Badge
                    fontSize="xs"
                    fontWeight="bold"
                    color="primary.600"
                    bg="primary.100"
                    px={2}
                    py={1}
                    borderRadius="md"
                    mb={3}
                  >
                    QUESTION
                  </Badge>
                  <Text fontSize="md" fontWeight="medium" color="text.primary" lineHeight="relaxed">
                    {currentQuestion.question}
                  </Text>
                </Box>

                {/* Mode Selection */}
                {!isTyping && !isSpeaking && (
                  <>
                    <HStack spacing={3}>
                      <Button
                        flex={1}
                        size="lg"
                        onClick={() => setIsTyping(true)}
                        leftIcon={<FiEdit />}
                        variant="outline"
                        borderRadius="xl"
                        borderWidth="2px"
                        _hover={{
                          bg: "primary.50",
                          borderColor: "primary.400",
                        }}
                      >
                        Type
                      </Button>
                      <Button
                        flex={1}
                        size="lg"
                        onClick={() => setIsSpeaking(true)}
                        leftIcon={<FiMic />}
                        variant="outline"
                        borderRadius="xl"
                        borderWidth="2px"
                        _hover={{
                          bg: "primary.50",
                          borderColor: "primary.400",
                        }}
                      >
                        Speak
                      </Button>
                    </HStack>
                    <Button
                      size="sm"
                      variant="ghost"
                      color="text.tertiary"
                      rightIcon={<FiArrowRight />}
                      onClick={skipQuestionClick}
                      alignSelf="center"
                    >
                      Skip question
                    </Button>
                  </>
                )}

                {/* Typing Mode */}
                {isTyping && (
                  <VStack spacing={4}>
                    {answerError && (
                      <Alert status="error" borderRadius="xl">
                        <AlertIcon />
                        <Text fontSize="sm">{answerError}</Text>
                      </Alert>
                    )}
                    <Textarea
                      placeholder="Type your answer here..."
                      size="lg"
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      resize="none"
                      minHeight="150px"
                      borderRadius="xl"
                      borderColor="primary.300"
                      borderWidth="2px"
                      _focus={{
                        borderColor: "primary.500",
                        boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.1)",
                      }}
                    />
                    <Button
                      width="100%"
                      size="lg"
                      onClick={submitTypedAnswer}
                      leftIcon={<FiSend />}
                      bgGradient="linear(135deg, primary.500, secondary.500)"
                      color="white"
                      borderRadius="xl"
                      _hover={{
                        bgGradient: "linear(135deg, primary.600, secondary.600)",
                      }}
                    >
                      Submit answer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<FiMic />}
                      onClick={() => {
                        setIsSpeaking(true);
                        setTextAnswer("");
                      }}
                    >
                      Switch to voice
                    </Button>
                  </VStack>
                )}

                {/* Speaking Mode */}
                {isSpeaking && (
                  <VStack spacing={4}>
                    {audioError && (
                      <Alert status="error" borderRadius="xl">
                        <AlertIcon />
                        <Text fontSize="sm">{audioError}</Text>
                      </Alert>
                    )}
                    <VStack spacing={3} py={4}>
                      <Tooltip
                        hasArrow
                        label={isRecording ? "Stop recording" : "Start recording"}
                      >
                        <IconButton
                          icon={isRecording ? <FiSquare /> : <FiMic />}
                          variant="outline"
                          size="lg"
                          rounded="full"
                          width="100px"
                          height="100px"
                          fontSize="2xl"
                          aria-label="Recording control"
                          onClick={isRecording ? stopRecording : startRecording}
                          borderWidth="3px"
                          borderColor={isRecording ? "red.500" : "primary.500"}
                          color={isRecording ? "red.500" : "primary.500"}
                          bg={isRecording ? "red.50" : "primary.50"}
                          animation={isRecording ? `${recordingPulse} 1.5s infinite` : undefined}
                          _hover={{
                            transform: "scale(1.05)",
                          }}
                        />
                      </Tooltip>
                      <Text fontSize="sm" color="text.tertiary">
                        {isRecording ? "Recording... Click to stop" : "Click to start recording"}
                      </Text>
                    </VStack>
                    {isRecording && (
                      <Button
                        size="sm"
                        variant="ghost"
                        color="red.500"
                        leftIcon={<FiX />}
                        onClick={cancelRecording}
                      >
                        Cancel recording
                      </Button>
                    )}
                    <Button
                      width="100%"
                      size="lg"
                      onClick={submitAudioAnswer}
                      leftIcon={<FiSend />}
                      isDisabled={audioError !== null || !audioBlob || isRecording}
                      bgGradient="linear(135deg, primary.500, secondary.500)"
                      color="white"
                      borderRadius="xl"
                      _hover={{
                        bgGradient: "linear(135deg, primary.600, secondary.600)",
                      }}
                      _disabled={{
                        opacity: 0.5,
                        cursor: "not-allowed",
                      }}
                    >
                      Submit audio
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<FiEdit />}
                      onClick={() => {
                        setIsTyping(true);
                        setTextAnswer("");
                      }}
                    >
                      Switch to text
                    </Button>
                  </VStack>
                )}
              </VStack>
            )}
          </Skeleton>

          <Divider my={6} />

          <Skeleton isLoaded={!answersLoading} borderRadius="xl">
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
