import React, { ReactNode } from "react";
import {
  Box,
  Flex,
  CloseButton,
  Drawer,
  DrawerContent,
  useDisclosure,
  useColorModeValue,
  BoxProps,
  VStack,
  Heading,
} from "@chakra-ui/react";
import {
  FiHome,
  FiUsers,
  FiBriefcase,
  FiSettings,
  FiBarChart,
} from "react-icons/fi";
import Link from "next/link";
import { IconType } from "react-icons";
import { TopNav } from "./TopNav";

interface SidebarItemProps {
  icon: IconType;
  children: ReactNode;
  href: string;
}

const SidebarItem = ({ icon, children, href, ...rest }: SidebarItemProps) => {
  return (
    <Link href={href} style={{ textDecoration: "none" }} passHref>
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        _hover={{
          bg: "brand.500",
          color: "white",
        }}
        {...rest}
      >
        {icon && (
          <Box mr="4">
            {React.createElement(icon, {
              size: 20,
            })}
          </Box>
        )}
        {children}
      </Flex>
    </Link>
  );
};

interface SidebarProps extends BoxProps {
  onClose: () => void;
}

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
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

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
      <SidebarContent
        onClose={onClose}
        display={{ base: "none", md: "block" }}
      />
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      <TopNav onOpen={onOpen} />
      <Box ml={{ base: 0, md: 60 }} p="4">
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
