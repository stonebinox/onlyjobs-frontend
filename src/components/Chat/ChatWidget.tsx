"use client";

import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  IconButton,
  Input,
  Spinner,
  Text,
  Tooltip,
  VStack,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import {
  FiClock,
  FiMessageSquare,
  FiPlus,
  FiSend,
  FiX,
} from "react-icons/fi";

import { useApi } from "@/hooks/useApi";

const CONVERSATION_ID_KEY = "onlyjobs_chat_conversationId";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  _id: string;
  createdAt: string;
  messages: Message[];
}

const SUGGESTED_PROMPTS = [
  "Why haven't I been receiving matches?",
  "How can I improve my profile?",
  "What skills should I add?",
];

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

export default function ChatWidget() {
  const { sendChatMessage, getChatConversations, getChatConversation } = useApi();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const drawerSize = useBreakpointValue({ base: "full", md: "md" }) as "full" | "md";

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const loadConversation = async (id: string) => {
    try {
      const data = await getChatConversation(id);
      setMessages(data.messages || []);
      setConversationId(id);
      localStorage.setItem(CONVERSATION_ID_KEY, id);
      setShowHistory(false);
    } catch {
      setError("Failed to load conversation.");
    }
  };

  const loadHistory = async () => {
    try {
      const data = await getChatConversations();
      setConversations(data.conversations || []);
    } catch {
      setConversations([]);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    const saved = localStorage.getItem(CONVERSATION_ID_KEY);
    if (saved) {
      await loadConversation(saved);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowHistory(false);
    setError(null);
  };

  const handleToggleHistory = async () => {
    if (!showHistory) {
      await loadHistory();
    }
    setShowHistory((prev) => !prev);
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    localStorage.removeItem(CONVERSATION_ID_KEY);
    setShowHistory(false);
    setError(null);
  };

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;

    const sentMessage = msg;
    setInput("");
    setError(null);
    setFailedMessage(null);
    setMessages((prev) => [...prev, { role: "user", content: sentMessage }]);
    setIsLoading(true);

    try {
      const data = await sendChatMessage(sentMessage, conversationId ?? undefined);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem(CONVERSATION_ID_KEY, data.conversationId);
      }
    } catch (err) {
      const errMsg = (err as Error).message || "";
      if (errMsg.toLowerCase().includes("session has expired") || errMsg.toLowerCase().includes("not authorized")) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(errMsg || "Something went wrong.");
      }
      setFailedMessage(sentMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <Box position="fixed" bottom="24px" right="24px" zIndex={1000}>
          <Tooltip label="Chat with AI" placement="left">
            <IconButton
              aria-label="Open chat"
              icon={<FiMessageSquare size={22} />}
              size="lg"
              borderRadius="full"
              bgGradient="linear(135deg, primary.500, secondary.500)"
              color="white"
              boxShadow="lg"
              _hover={{
                bgGradient: "linear(135deg, primary.600, secondary.600)",
                transform: "scale(1.05)",
              }}
              onClick={handleOpen}
            />
          </Tooltip>
        </Box>
      )}

      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={handleClose}
        size={drawerSize}
      >
        <DrawerOverlay bg="blackAlpha.400" />
        <DrawerContent borderLeftRadius={{ md: "2xl" }}>
          <DrawerHeader
            bgGradient="linear(135deg, #F5F3FF 0%, #FDF2F8 50%, #FFF7ED 100%)"
            borderBottom="1px solid"
            borderColor="primary.100"
            py={4}
          >
            <HStack justify="space-between">
              <Text fontFamily="heading" fontWeight="bold" fontSize="lg">
                OnlyJobs AI
              </Text>
              <HStack spacing={1}>
                <Tooltip label="History" placement="bottom">
                  <IconButton
                    aria-label="View history"
                    icon={<FiClock />}
                    size="sm"
                    variant="ghost"
                    onClick={handleToggleHistory}
                    color={showHistory ? "primary.500" : undefined}
                  />
                </Tooltip>
                <Tooltip label="New conversation" placement="bottom">
                  <IconButton
                    aria-label="New conversation"
                    icon={<FiPlus />}
                    size="sm"
                    variant="ghost"
                    onClick={handleNewConversation}
                  />
                </Tooltip>
                <DrawerCloseButton position="static" />
              </HStack>
            </HStack>
          </DrawerHeader>

          <DrawerBody p={0}>
            {showHistory ? (
              <VStack align="stretch" spacing={0} p={4}>
                <Text fontSize="sm" fontWeight="semibold" color="text.secondary" mb={3}>
                  Past conversations
                </Text>
                {conversations.length === 0 ? (
                  <Text fontSize="sm" color="text.tertiary">No previous conversations.</Text>
                ) : (
                  conversations.map((conv) => (
                    <Box
                      key={conv._id}
                      p={3}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="gray.200"
                      mb={2}
                      cursor="pointer"
                      _hover={{ bg: "gray.50", borderColor: "primary.300" }}
                      onClick={() => loadConversation(conv._id)}
                    >
                      <Text fontSize="sm" color="text.primary" noOfLines={1}>
                        {conv.messages?.[0]?.content || "Conversation"}
                      </Text>
                      <Text fontSize="xs" color="text.tertiary" mt={1}>
                        {new Date(conv.createdAt).toLocaleDateString()}
                      </Text>
                    </Box>
                  ))
                )}
              </VStack>
            ) : (
              <Box
                h="full"
                overflowY="auto"
                p={4}
                display="flex"
                flexDirection="column"
              >
                {messages.length === 0 && !isLoading ? (
                  <VStack spacing={3} mt={6}>
                    <Text fontSize="sm" color="text.secondary" mb={2}>
                      Ask me anything about your job search:
                    </Text>
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <Box
                        key={prompt}
                        w="full"
                        p={3}
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="lg"
                        cursor="pointer"
                        fontSize="sm"
                        color="text.primary"
                        _hover={{ bg: "primary.50", borderColor: "primary.300" }}
                        onClick={() => handleSend(prompt)}
                      >
                        {prompt}
                      </Box>
                    ))}
                  </VStack>
                ) : (
                  <VStack align="stretch" spacing={3} flex={1}>
                    {messages.map((msg, i) => (
                      <Box
                        key={i}
                        alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
                        maxW="80%"
                        bg={msg.role === "user" ? "primary.500" : "gray.100"}
                        color={msg.role === "user" ? "white" : "gray.800"}
                        borderRadius="lg"
                        px={4}
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

                    {isLoading && (
                      <Box alignSelf="flex-start" bg="gray.100" borderRadius="lg" px={4} py={2}>
                        <Spinner size="xs" color="primary.500" />
                      </Box>
                    )}

                    {error && (
                      <Alert status="error" borderRadius="lg" fontSize="sm">
                        <AlertIcon />
                        <Box flex={1}>
                          <Text>{error}</Text>
                        </Box>
                        {failedMessage && (
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="red"
                            mr={2}
                            onClick={() => {
                              const msg = failedMessage;
                              setFailedMessage(null);
                              setMessages((prev) => prev.slice(0, -1));
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
                          onClick={() => { setError(null); setFailedMessage(null); }}
                        />
                      </Alert>
                    )}

                    <div ref={messagesEndRef} />
                  </VStack>
                )}
              </Box>
            )}
          </DrawerBody>

          {!showHistory && (
            <DrawerFooter borderTop="1px solid" borderColor="gray.200" p={3}>
              <HStack w="full" spacing={2}>
                <Input
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  borderRadius="xl"
                  size="md"
                  isDisabled={isLoading}
                />
                <IconButton
                  aria-label="Send message"
                  icon={<FiSend />}
                  onClick={() => handleSend()}
                  isDisabled={!input.trim() || isLoading}
                  bgGradient="linear(135deg, primary.500, secondary.500)"
                  color="white"
                  borderRadius="xl"
                  _hover={{
                    bgGradient: "linear(135deg, primary.600, secondary.600)",
                  }}
                  _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                />
              </HStack>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
