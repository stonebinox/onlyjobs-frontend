import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import Head from "next/head";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Page Not Found | OnlyJobs</title>
      </Head>
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="surface.background"
        px={4}
      >
        <VStack spacing={6} textAlign="center" maxW="md">
          <Heading
            fontSize="8xl"
            fontWeight="bold"
            bgGradient="linear(135deg, primary.500, secondary.500)"
            bgClip="text"
            lineHeight="1"
          >
            404
          </Heading>
          <Heading size="lg" color="text.primary">
            Page not found
          </Heading>
          <Text color="text.secondary" fontSize="md">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </Text>
          <Button
            as={Link}
            href="/"
            bgGradient="linear(135deg, primary.500, secondary.500)"
            color="white"
            fontWeight="bold"
            borderRadius="xl"
            size="lg"
            _hover={{
              bgGradient: "linear(135deg, primary.600, secondary.600)",
              transform: "translateY(-1px)",
            }}
          >
            Back to home
          </Button>
        </VStack>
      </Box>
    </>
  );
}
