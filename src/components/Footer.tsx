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

const ContactLink = styled(Link)`
  color: #abc9ed; /* primary.200 - light brand blue, AAA on the dark footer */
  text-decoration: underline;
  font-size: 0.75rem;
  &:visited {
    color: #abc9ed;
  }
  &:hover,
  &:focus-visible {
    color: #ffffff;
    text-decoration: underline;
  }
  &:focus-visible {
    outline: 2px solid #ffffff;
    outline-offset: 2px;
  }
  @media (min-width: 48em) {
    font-size: 0.875rem;
  }
`;

const MinimalLink = styled(Link)`
  color: #abc9ed; /* primary.200 - light brand blue, AAA on the dark footer */
  text-decoration: underline;
  font-size: 0.65rem;
  &:visited {
    color: #abc9ed;
  }
  &:hover,
  &:focus-visible {
    color: #ffffff;
    text-decoration: underline;
  }
  &:focus-visible {
    outline: 2px solid #ffffff;
    outline-offset: 2px;
  }
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
      position={"relative"}
      width={"100%"}
    >
      <Container maxW="container.xl" px={{ base: 4, md: 6 }}>
        <VStack spacing={{ base: 2, md: 4 }}>
          <HStack spacing={2}>
            <Heading as="span" size={{ base: "sm", md: "md" }} color="white">
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
            <ContactLink href="/privacy-policy">
              Privacy Policy
            </ContactLink>
            <ContactLink href="/terms-conditions">
              Terms &amp; Conditions
            </ContactLink>
            <ContactLink href="/refund-policy">
              Refund Policy
            </ContactLink>
            <ContactLink href="/how-it-works">
              How it works
            </ContactLink>
            <ContactLink href="/sample-match-report">
              Sample Report
            </ContactLink>
            <ContactLink href="/about">
              About
            </ContactLink>
            <ContactLink href="/ai-job-tools">
              How OnlyJobs is different
            </ContactLink>
            <ContactLink href="/blog">
              Blog
            </ContactLink>
            <ContactLink href="mailto:contact@auroradesignshq.com">
              Contact Us
            </ContactLink>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};
