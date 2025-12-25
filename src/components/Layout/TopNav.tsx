import {
  Avatar,
  Box,
  Flex,
  FlexProps,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorModeValue,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FiChevronDown, FiMenu } from "react-icons/fi";
import { FaWallet } from "react-icons/fa";

import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";

interface TopNavProps extends FlexProps {
  onOpen: () => void;
}

export const TopNav = ({ onOpen, ...rest }: TopNavProps) => {
  const [username, setUsername] = useState<string>("User");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const { getUserName, getWalletBalance } = useApi();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    auth.logout();
    router.push("/");
  };

  useEffect(() => {
    const fetchUsername = async () => {
      if (!auth || !auth.userId) return;

      try {
        const usernameResponse = await getUserName(auth.userId);
        const { username } = usernameResponse;
        setUsername(username);
      } catch (error) {
        console.error(error);
        setUsername("User");
      }
    };

    const fetchWalletBalance = async () => {
      if (!auth?.isLoggedIn) return;

      try {
        const result = await getWalletBalance();
        if (typeof result === "number") {
          setWalletBalance(result);
        } else if (result && typeof result === "object" && "error" in result) {
          console.error("Error fetching wallet balance:", result.error);
        }
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
      }
    };

    fetchUsername();
    fetchWalletBalance();
  }, [auth, getUserName, getWalletBalance]);

  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue("white", "gray.900")}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent={{ base: "space-between", md: "flex-end" }}
      {...rest}
    >
      <IconButton
        display={{ base: "flex", md: "none" }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <HStack spacing={2}>
        <Text
          display={{ base: "flex", md: "none" }}
          fontSize="2xl"
          fontWeight="bold"
        >
          OnlyJobs
        </Text>
        <Badge
          display={{ base: "flex", md: "none" }}
          colorScheme="orange"
          fontSize="0.6em"
          px={2}
          py={0.5}
        >
          BETA
        </Badge>
      </HStack>

      <HStack spacing={{ base: "0", md: "6" }}>
        <HStack
          spacing={2}
          cursor="pointer"
          p={2}
          borderRadius="md"
          _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
          onClick={() => router.push("/wallet")}
        >
          <Icon
            as={FaWallet}
            fontSize="1.2rem"
            color={useColorModeValue("blue.500", "blue.300")}
          />
          <Text fontWeight="medium" fontSize="sm">
            {walletBalance !== null ? `$${walletBalance.toFixed(2)}` : "-"}
          </Text>
        </HStack>
        <Flex alignItems={"center"}>
          <Menu>
            <MenuButton
              py={2}
              transition="all 0.3s"
              _focus={{ boxShadow: "none" }}
            >
              <HStack>
                <Avatar size={"sm"} name={username} />
                <VStack
                  display={{ base: "none", md: "flex" }}
                  alignItems="flex-start"
                  spacing="1px"
                  ml="2"
                >
                  <Text fontSize="sm">{username}</Text>
                </VStack>
                <Box display={{ base: "none", md: "flex" }}>
                  <FiChevronDown />
                </Box>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => router.push("/profile")}>
                Profile
              </MenuItem>
              <MenuItem onClick={() => router.push("/settings")}>
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>Sign out</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  );
};
