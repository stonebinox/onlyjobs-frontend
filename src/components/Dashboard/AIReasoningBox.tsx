import { Box, Text, HStack } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { TbSparkles } from "react-icons/tb";

interface AIReasoningBoxProps {
  reasoning: string;
}

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
`;

export const AIReasoningBox = ({ reasoning }: AIReasoningBoxProps) => {
  return (
    <Box
      position="relative"
      mt={4}
      p={4}
      pt={5}
      borderRadius="xl"
      bg="primary.50"
      border="1px solid"
      borderColor="primary.200"
      overflow="visible"
    >
      {/* Floating AI Badge */}
      <HStack
        position="absolute"
        top={0}
        left={4}
        transform="translateY(-50%)"
        px={3}
        py={1}
        borderRadius="full"
        bg="primary.500"
        color="white"
        fontSize="xs"
        fontWeight="bold"
        spacing={1.5}
        boxShadow="button"
      >
        <Box
          as={TbSparkles}
          animation={`${pulse} 2s infinite`}
          fontSize="sm"
        />
        <Text>AI Insight</Text>
      </HStack>

      {/* Content */}
      <Text
        color="text.primary"
        fontSize="sm"
        lineHeight="relaxed"
      >
        {reasoning}
      </Text>
    </Box>
  );
};

export default AIReasoningBox;
