import {
  Box,
  Container,
  Heading,
  HStack,
  Text,
  useColorModeValue,
  VStack,
  Badge,
} from "@chakra-ui/react";
import Link from "next/link";
import styled from "styled-components";

import theme from "@/theme/theme";

const ContactLink = styled(Link)`
  color: ${theme.colors.semantic.primary};
  font-size: 0.75rem;
  @media (min-width: 48em) {
    font-size: 0.875rem;
  }
`;

const MinimalLink = styled(Link)`
  color: ${theme.colors.semantic.primary};
  font-size: 0.65rem;
  @media (min-width: 48em) {
    font-size: 0.75rem;
  }
`;

interface FooterProps {
  minimal?: boolean;
}

export const Footer = ({ minimal = false }: FooterProps) => {
  const bgColor = useColorModeValue("gray.700", "gray.900");

  if (minimal) {
    return (
      <Box
        bg={bgColor}
        py={2}
        position={"fixed"}
        width={"100%"}
        bottom={"0px"}
        left={"0px"}
        zIndex={10}
      >
        <Container maxW="container.xl" px={{ base: 2, md: 4 }}>
          <HStack
            justify="space-between"
            align="center"
            flexWrap="wrap"
            spacing={2}
          >
            <Text color="gray.400" fontSize="xs">
              © {new Date().getFullYear()} OnlyJobs
            </Text>
            <HStack spacing={{ base: 2, md: 3 }} flexWrap="wrap">
              <MinimalLink href="/privacy-policy">Privacy</MinimalLink>
              <MinimalLink href="/terms-conditions">Terms</MinimalLink>
              <MinimalLink href="mailto:contact@auroradesignshq.com">
                Contact
              </MinimalLink>
            </HStack>
          </HStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      bg={bgColor}
      py={{ base: 6, md: 10 }}
      position={"fixed"}
      width={"100%"}
      bottom={"0px"}
      left={"0px"}
      zIndex={10}
    >
      <Container maxW="container.xl" px={{ base: 4, md: 6 }}>
        <VStack spacing={{ base: 2, md: 4 }}>
          <HStack spacing={2}>
            <Heading size={{ base: "sm", md: "md" }} color="white">
              OnlyJobs
            </Heading>
            <Badge
              colorScheme="orange"
              fontSize={{ base: "0.6em", md: "0.7em" }}
              px={2}
              py={0.5}
            >
              BETA
            </Badge>
          </HStack>
          <Text
            textAlign="center"
            color="white"
            fontSize={{ base: "xs", md: "sm" }}
            px={{ base: 2, md: 0 }}
          >
            © {new Date().getFullYear()} OnlyJobs. All rights reserved.
          </Text>
          <HStack
            flexWrap="wrap"
            justify="center"
            spacing={{ base: 2, md: 4 }}
          >
            <ContactLink href="/privacy-policy" color="semantic.primary">
              Privacy Policy
            </ContactLink>
            <ContactLink href="/terms-conditions" color="semantic.primary">
              Terms &amp; Conditions
            </ContactLink>
            <ContactLink href="/refund-policy" color="semantic.primary">
              Refund Policy
            </ContactLink>
            <ContactLink
              href="mailto:contact@auroradesignshq.com"
              color="semantic.primary"
            >
              Contact Us
            </ContactLink>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};
