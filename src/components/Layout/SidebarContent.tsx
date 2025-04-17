import {
  Box,
  BoxProps,
  CloseButton,
  Flex,
  Heading,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import {
  FiBarChart,
  FiBriefcase,
  FiHome,
  FiSettings,
  FiUsers,
} from "react-icons/fi";
import { SidebarItem } from "./SidebarItem";

interface SidebarProps extends BoxProps {
  onClose: () => void;
}

export const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
  return (
    <Box
      transition="3s ease"
      bg={useColorModeValue("white", "gray.900")}
      borderRight="1px"
      borderRightColor={useColorModeValue("gray.200", "gray.700")}
      w={{ base: "full", md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Heading size="md" fontWeight="bold">
          OnlyJobs
        </Heading>
        <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
      </Flex>
      <VStack spacing={2} align="stretch">
        <SidebarItem icon={FiHome} href="/dashboard">
          Dashboard
        </SidebarItem>
        <SidebarItem icon={FiBriefcase} href="/dashboard/jobs">
          Job Listings
        </SidebarItem>
        <SidebarItem icon={FiUsers} href="/dashboard/candidates">
          Candidates
        </SidebarItem>
        <SidebarItem icon={FiBarChart} href="/dashboard/analytics">
          Analytics
        </SidebarItem>
        <SidebarItem icon={FiSettings} href="/dashboard/settings">
          Settings
        </SidebarItem>
      </VStack>
    </Box>
  );
};
