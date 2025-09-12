import {
  Box,
  Container,
  Heading,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import styled from "styled-components";

import theme from "@/theme/theme";

const ContactLink = styled(Link)`
  color: ${theme.colors.semantic.primary};
`;

export const Footer = () => {
  return (
    <Box
      bg={useColorModeValue("gray.700", "gray.900")}
      py={10}
      position={"fixed"}
      width={"100%"}
      bottom={"0px"}
      left={"0px"}
    >
      <Container maxW="container.xl">
        <VStack>
          <Heading size="md" mb={4} color="white">
            OnlyJobs
          </Heading>
          <Text textAlign="center" color="white">
            © {new Date().getFullYear()} OnlyJobs. All rights reserved.
          </Text>
          <ContactLink href="/privacy-policy" color="semantic.primary">
            Privacy Policy
          </ContactLink>
        </VStack>
      </Container>
    </Box>
  );
};
