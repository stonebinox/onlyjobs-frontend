import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Stack,
  Image,
  HStack,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import Link from "next/link";

export default function Home() {
  return (
    <Box>
      <Box
        bg={useColorModeValue("brand.500", "brand.600")}
        px={4}
        color="white"
      >
        <Container maxW="container.xl">
          <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
            <Heading size="md">OnlyJobs</Heading>
            <HStack spacing={4}>
              <Link href="/login" passHref>
                <Button variant="outline" colorScheme="whiteAlpha">
                  Login
                </Button>
              </Link>
              <Link href="/register" passHref>
                <Button colorScheme="whiteAlpha" variant="solid">
                  Sign Up
                </Button>
              </Link>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" py={12}>
        <Stack
          align={"center"}
          spacing={{ base: 8, md: 10 }}
          direction={{ base: "column", md: "row" }}
          py={{ base: 10, md: 20 }}
        >
          <Stack flex={1} spacing={{ base: 5, md: 10 }}>
            <Heading
              lineHeight={1.1}
              fontWeight={600}
              fontSize={{ base: "3xl", sm: "4xl", lg: "6xl" }}
            >
              <Text as={"span"} position={"relative"} color="brand.500">
                Find your perfect job
              </Text>
              <br />
              <Text
                as={"span"}
                fontSize={{ base: "2xl", sm: "3xl", lg: "4xl" }}
              >
                or the perfect candidate
              </Text>
            </Heading>
            <Text color={"gray.500"}>
              OnlyJobs is a platform that connects job seekers with the right
              employers. We use advanced matching algorithms to ensure the
              perfect fit for both parties.
            </Text>
            <Stack
              spacing={{ base: 4, sm: 6 }}
              direction={{ base: "column", sm: "row" }}
            >
              <Link href="/dashboard" passHref>
                <Button
                  rounded={"full"}
                  size={"lg"}
                  fontWeight={"normal"}
                  colorScheme={"blue"}
                  bg={"brand.500"}
                  _hover={{ bg: "brand.600" }}
                >
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/register" passHref>
                <Button
                  rounded={"full"}
                  size={"lg"}
                  fontWeight={"normal"}
                  variant="outline"
                >
                  Create Account
                </Button>
              </Link>
            </Stack>
          </Stack>
          <Flex
            flex={1}
            justify={"center"}
            align={"center"}
            position={"relative"}
          >
            <Box
              position={"relative"}
              height={"300px"}
              rounded={"2xl"}
              boxShadow={"2xl"}
              width={"full"}
              overflow={"hidden"}
            >
              <Image
                alt={"Hero Image"}
                fit={"cover"}
                align={"center"}
                w={"100%"}
                h={"100%"}
                src={
                  "https://images.unsplash.com/photo-1568992687947-868a62a9f521?q=80&w=1000"
                }
              />
            </Box>
          </Flex>
        </Stack>

        <VStack spacing={8} mt={10}>
          <Heading as="h2" size="xl">
            How It Works
          </Heading>
          <Stack direction={{ base: "column", md: "row" }} spacing={10}>
            <Box textAlign="center" p={5}>
              <Heading size="md" mb={4}>
                For Job Seekers
              </Heading>
              <Text>
                Create your profile, upload your resume, and let our AI-powered
                system match you with the perfect job opportunities.
              </Text>
            </Box>
            <Box textAlign="center" p={5}>
              <Heading size="md" mb={4}>
                For Employers
              </Heading>
              <Text>
                Post job listings, review qualified candidates, and use our
                tools to streamline your hiring process.
              </Text>
            </Box>
            <Box textAlign="center" p={5}>
              <Heading size="md" mb={4}>
                Smart Matching
              </Heading>
              <Text>
                Our advanced algorithms ensure that candidates and jobs are
                matched based on skills, experience, and preferences.
              </Text>
            </Box>
          </Stack>
        </VStack>
      </Container>

      <Box bg={useColorModeValue("gray.100", "gray.900")} py={10}>
        <Container maxW="container.xl">
          <VStack>
            <Heading size="md" mb={4}>
              OnlyJobs
            </Heading>
            <Text textAlign="center">
              © 2023 OnlyJobs. All rights reserved.
            </Text>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
