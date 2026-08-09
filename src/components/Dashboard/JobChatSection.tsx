import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Divider,
  HStack,
  IconButton,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FiSend, FiX } from "react-icons/fi";

import { createApiClient } from "@/lib/apiClient";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function renderMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  const withBold = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const lines = withBold.split("\n");
  const processed = lines.map((line) =>
    line.startsWith("- ") ? `<li>${line.slice(2)}</li>` : line
  );
  return processed.join("<br/>");
}

interface JobChatSectionProps {
  matchId: string;
}

const isAuthError = (msg: string): boolean => {
  const m = (msg || "").toLowerCase();
  return m.includes("session expired") || m.includes("session has expired") || m.includes("not authorized");
};
const SESSION_EXPIRED_MSG = "Your session has expired. Please log in again.";

export const JobChatSection = ({ matchId }: JobChatSectionProps) => {
  const { createOrGetJobConversation, sendChatMessage } = createApiClient();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversation = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await createOrGetJobConversation(matchId);
      if ('error' in data) {
        const errMsg = typeof data.error === 'string' && data.error ? data.error : "Failed to load conversation.";
        setLoadError(isAuthError(errMsg) ? SESSION_EXPIRED_MSG : errMsg);
        return;
      }
      setConversationId(data.conversationId);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (err) {
      const errMsg = (err as Error).message || "Failed to load conversation.";
      setLoadError(isAuthError(errMsg) ? SESSION_EXPIRED_MSG : errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSending]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isSending || !conversationId) return;

    const sentMessage = msg;
    setInput("");
    setSendError(null);
    setFailedMessage(null);
    setMessages((prev) => [...prev, { role: "user", content: sentMessage }]);
    setIsSending(true);

    try {
      const data = await sendChatMessage(sentMessage, conversationId);
      if ('error' in data) {
        const errMsg = typeof data.error === 'string' && data.error ? data.error : "Something went wrong.";
        setSendError(isAuthError(errMsg) ? SESSION_EXPIRED_MSG : errMsg);
        if (!isAuthError(errMsg)) setFailedMessage(sentMessage);
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      const errMsg = (err as Error).message || "Something went wrong.";
      setSendError(isAuthError(errMsg) ? SESSION_EXPIRED_MSG : errMsg);
      if (!isAuthError(errMsg)) setFailedMessage(sentMessage);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Divider />
      <Box>
        <Text fontWeight="semibold" fontSize="sm" mb={1} color="text.secondary">
          Ask AI about this job
        </Text>
        <Text fontSize="xs" color="text.tertiary" mb={3}>
          Ask about your fit, eligibility, how to improve, or anything about the role or company.
        </Text>

        {isLoading ? (
          <Box py={4} display="flex" justifyContent="center">
            <Spinner size="sm" color="primary.400" />
          </Box>
        ) : loadError ? (
          <Alert status="error" borderRadius="md" fontSize="sm" py={2}>
            <AlertIcon />
            <Box flex={1}>
              <Text fontSize="sm">{loadError}</Text>
            </Box>
            {loadError !== SESSION_EXPIRED_MSG && (
              <Button size="xs" variant="outline" colorScheme="red" onClick={loadConversation}>
                Retry
              </Button>
            )}
          </Alert>
        ) : (
          <VStack align="stretch" spacing={2}>
            {/* Message list */}
            <Box
              maxH="320px"
              overflowY="auto"
              display="flex"
              flexDirection="column"
              gap={2}
            >
              {messages.length === 0 && !isSending && (
                <Text fontSize="xs" color="text.tertiary" textAlign="center" py={3}>
                  No messages yet — ask your first question.
                </Text>
              )}
              {messages.map((msg, i) => (
                <Box
                  key={i}
                  alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
                  maxW="85%"
                  bg={msg.role === "user" ? "primary.500" : "gray.100"}
                  color={msg.role === "user" ? "white" : "gray.800"}
                  borderRadius="lg"
                  px={3}
                  py={2}
                >
                  {msg.role === "user" ? (
                    <Text fontSize="sm" whiteSpace="pre-wrap">
                      {msg.content}
                    </Text>
                  ) : (
                    <Box
                      fontSize="sm"
                      whiteSpace="pre-wrap"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                      sx={{ strong: { fontWeight: "bold" }, li: { ml: 4 } }}
                    />
                  )}
                </Box>
              ))}

              {isSending && (
                <Box alignSelf="flex-start" bg="gray.100" borderRadius="lg" px={3} py={2}>
                  <Spinner size="xs" color="primary.400" />
                </Box>
              )}

              {sendError && (
                <Alert status="error" borderRadius="md" fontSize="sm" py={2}>
                  <AlertIcon />
                  <Box flex={1}>
                    <Text fontSize="sm">{sendError}</Text>
                  </Box>
                  {failedMessage && (
                    <Button
                      size="xs"
                      variant="outline"
                      colorScheme="red"
                      mr={1}
                      onClick={() => {
                        const msg = failedMessage;
                        setFailedMessage(null);
                        setSendError(null);
                        handleSend(msg);
                      }}
                    >
                      Retry
                    </Button>
                  )}
                  <IconButton
                    aria-label="Dismiss error"
                    icon={<FiX />}
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setSendError(null);
                      setFailedMessage(null);
                    }}
                  />
                </Alert>
              )}

              <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <HStack spacing={2}>
              <Input
                placeholder="Type a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                size="sm"
                borderRadius="lg"
                isDisabled={isSending}
              />
              <IconButton
                aria-label="Send message"
                icon={<FiSend />}
                size="sm"
                onClick={() => handleSend()}
                isDisabled={!input.trim() || isSending}
                bg="primary.500"
                color="white"
                borderRadius="lg"
                _hover={{ bg: "primary.600" }}
                _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
              />
            </HStack>
          </VStack>
        )}
      </Box>
    </>
  );
};
