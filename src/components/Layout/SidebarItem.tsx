import { Box, Flex } from "@chakra-ui/react";
import Link from "next/link";
import { createElement, ReactNode } from "react";
import { IconType } from "react-icons";

interface SidebarItemProps {
  icon: IconType;
  children: ReactNode;
  href: string;
  selected?: boolean;
}

export const SidebarItem = ({
  icon,
  children,
  href,
  selected = false,
  ...rest
}: SidebarItemProps) => {
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
        {...(selected && {
          bg: "brand.500",
          color: "white",
        })}
        {...rest}
      >
        {icon && (
          <Box mr="4">
            {createElement(icon, {
              size: 20,
            })}
          </Box>
        )}
        {children}
      </Flex>
    </Link>
  );
};
