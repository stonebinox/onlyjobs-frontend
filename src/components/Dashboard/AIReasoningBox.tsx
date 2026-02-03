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
      bgGradient="linear(135deg, #F5F3FF 0%, #FDF2F8 50%, #FFF7ED 100%)"
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
        bgGradient="linear(135deg, #8B5CF6 0%, #EC4899 50%, #F97316 100%)"
        color="white"
        fontSize="xs"
        fontWeight="bold"
        spacing={1.5}
        boxShadow="0 0 20px rgba(139, 92, 246, 0.3)"
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
