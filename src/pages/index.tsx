import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Stack,
  VStack,
  useColorModeValue,
  Input,
  Badge,
  HStack,
} from "@chakra-ui/react";
import styled from "styled-components";

import theme from "@/theme/theme";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/Footer";

const StyledText = styled.span`
  color: ${theme.colors.semantic.primary};
  font-weight: bold;
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  gap: 16px;
`;

export default function Home() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fieldError, setFieldError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const auth = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(false);

    if (email.trim() === "" || password.trim() === "" || password.length < 8) {
      setFieldError(true);

      return;
    }

    setLoading(true);

    try {
      await auth?.authenticate(email, password);
    } catch (e) {
      console.error(e);
      setFieldError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth?.isLoggedIn) return;

    router.push("/dashboard");
  }, [auth?.isLoggedIn, router]);

  return (
    <Box>
      <Box
        bg={useColorModeValue("brand.900", "brand.900")}
        px={4}
        color="white"
      >
        <Container maxW="container.xl">
          <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
            <HStack spacing={2}>
              <Heading size="md">OnlyJobs</Heading>
              <Badge colorScheme="orange" fontSize="0.7em" px={2} py={0.5}>
                BETA
              </Badge>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" py={12} mb={36}>
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
              <Text as={"span"} position={"relative"} color="brand.800">
                Stop applying everywhere.
              </Text>
              <br />
              <Text
                as={"span"}
                fontSize={{ base: "2xl", sm: "3xl", lg: "4xl" }}
                color={"brand.500"}
              >
                Start applying <StyledText>smarter</StyledText>.
              </Text>
            </Heading>
            <Text color={"gray.600"} fontSize="lg">
              OnlyJobs matches you with jobs based on your actual experience and
              preferences and not just keyword spam. Get a{" "}
              <StyledText>confidence score</StyledText> for each match so you
              know where to focus your effort.
            </Text>
            <Text color={"gray.500"}>
              Built by a dev who was tired of the same broken job search. No
              auto-apply, no spray-and-pray. Just smarter matching.
            </Text>
            {/* <Stack
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
            </Stack> */}
          </Stack>
          <Flex
            flex={1}
            justify={"center"}
            align={"center"}
            position={"relative"}
            width="100%"
          >
            <form onSubmit={handleSubmit}>
              <FormContainer>
                <Heading size="sm">Login or Sign up</Heading>
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  Free to start. See your matches in minutes.
                </Text>
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  onChange={(e) => setEmail(e.target.value)}
                  isInvalid={fieldError}
                />
                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  onChange={(e) => setPassword(e.target.value)}
                  isInvalid={fieldError}
                />
                <Button
                  type="submit"
                  variant={"solid"}
                  width="100%"
                  isDisabled={loading}
                  isLoading={loading}
                  loadingText="Processing ..."
                >
                  Get started
                </Button>
                <Text fontSize={"xs"} color={"gray.400"} textAlign={"center"}>
                  By proceeding, you consent to having your personal information
                  processed
                  <br />
                  OnlyJobs won&apos;t share your data with anyone directly. But,
                  it does use AI to parse your information.
                </Text>
              </FormContainer>
            </form>
          </Flex>
        </Stack>

        <VStack spacing={8} mt={10}>
          <Heading as="h2" size="xl" color="brand.500">
            How It Works
          </Heading>
          <Stack direction={{ base: "column", md: "row" }} spacing={10}>
            <Box textAlign="center" p={5}>
              <Heading size="md" mb={4}>
                Upload Once, Done
              </Heading>
              <Text>
                Upload your CV and <StyledText>we handle the rest</StyledText>.
                AI parses your experience and asks follow-up questions
                conversationally. No forms, no repetitive data entry. Talk your
                way through it.
              </Text>
            </Box>
            <Box textAlign="center" p={5}>
              <Heading size="md" mb={4}>
                Fresh Listings, Zero Noise
              </Heading>
              <Text>
                Jobs aggregated daily from multiple platforms, all in one place.
                Vague, shady, and inconsistent listings are filtered out and
                cleaned up — so you only see{" "}
                <StyledText>what&apos;s worth your time</StyledText>.
              </Text>
            </Box>
            <Box textAlign="center" p={5}>
              <Heading size="md" mb={4}>
                Match Scores You Can Trust
              </Heading>
              <Text>
                Every job comes with a{" "}
                <StyledText>confidence score and reasoning</StyledText> — so you
                know exactly why it&apos;s a good fit. Prioritize your
                applications based on data, not guesswork.
              </Text>
            </Box>
          </Stack>
        </VStack>
      </Container>
      <Footer />
    </Box>
  );
}
