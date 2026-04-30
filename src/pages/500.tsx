import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import Head from "next/head";
import Link from "next/link";

export default function ServerError() {
  return (
    <>
      <Head>
        <title>Server Error | OnlyJobs</title>
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
            500
          </Heading>
          <Heading size="lg" color="text.primary">
            Something went wrong
          </Heading>
          <Text color="text.secondary" fontSize="md">
            We ran into an unexpected error. Try refreshing the page or come back in a moment.
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
