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
}

export default function StatCard(props: StatsCardProps) {
  const { title, stat, icon } = props;

  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py="5"
      shadow="base"
      borderColor={useColorModeValue("gray.800", "gray.500")}
      rounded="lg"
      bg={useColorModeValue("white", "gray.700")}
    >
      <Flex justifyContent="space-between">
        <Box pl={{ base: 2, md: 4 }}>
          <StatLabel fontWeight="medium" isTruncated>
            {title}
          </StatLabel>
          <StatNumber fontSize="2xl" fontWeight="medium">
            {stat}
          </StatNumber>
        </Box>
        <Box
          my="auto"
          color={useColorModeValue("gray.800", "gray.200")}
          alignContent="center"
        >
          {icon}
        </Box>
      </Flex>
    </Stat>
  );
}
