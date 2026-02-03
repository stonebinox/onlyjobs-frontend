import {
  Box,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  useColorModeValue,
} from "@chakra-ui/react";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  stat: string;
  icon: ReactNode;
  accentColor?: string;
}

export default function StatCard(props: StatsCardProps) {
  const { title, stat, icon, accentColor = "primary.500" } = props;

  return (
    <Stat
      position="relative"
      px={{ base: 4, md: 5 }}
      py={5}
      borderRadius="2xl"
      border="1px solid"
      borderColor={useColorModeValue("surface.border", "gray.600")}
      bg={useColorModeValue("surface.card", "gray.700")}
      boxShadow="card"
      overflow="hidden"
      transition="all 0.2s ease"
      _hover={{
        boxShadow: "cardHover",
        borderColor: "primary.200",
      }}
    >
      {/* Top accent bar */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        height="4px"
        bg={accentColor}
      />

      <Flex justifyContent="space-between" alignItems="flex-start">
        <Box>
          <StatLabel
            fontSize="xs"
            fontWeight="semibold"
            color={useColorModeValue("text.tertiary", "gray.400")}
            textTransform="uppercase"
            letterSpacing="wide"
            mb={2}
          >
            {title}
          </StatLabel>
          <StatNumber
            fontSize="3xl"
            fontWeight="bold"
            fontFamily="mono"
            color={useColorModeValue("text.primary", "white")}
          >
            {stat}
          </StatNumber>
        </Box>
        <Box
          p={3}
          borderRadius="xl"
          bg={useColorModeValue("primary.50", "primary.900")}
          color={useColorModeValue("primary.500", "primary.300")}
        >
          {icon}
        </Box>
      </Flex>
    </Stat>
  );
}
