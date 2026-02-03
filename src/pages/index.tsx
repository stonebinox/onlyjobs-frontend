import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Stack,
  VStack,
  Input,
  Badge,
  HStack,
  SimpleGrid,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import Link from "next/link";
import { FiUpload, FiTarget, FiZap } from "react-icons/fi";
import { TbSparkles } from "react-icons/tb";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/Footer";

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
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
    <Box minH="100vh" bg="surface.bg">
      {/* Navigation */}
      <Box
        bg="primary.900"
        px={4}
        color="white"
        position="sticky"
        top={0}
        zIndex={100}
      >
        <Container maxW="container.xl">
          <Flex h={16} alignItems="center" justifyContent="space-between">
            <HStack spacing={2}>
              <Heading size="md" fontFamily="heading">OnlyJobs</Heading>
              <Badge
                bgGradient="linear(135deg, secondary.400, secondary.600)"
                color="white"
                fontSize="0.65em"
                px={2}
                py={0.5}
                borderRadius="full"
                fontWeight="bold"
              >
                BETA
              </Badge>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        position="relative"
        overflow="hidden"
        bgGradient="linear(180deg, surface.bg 0%, #F5F3FF 100%)"
      >
        {/* Decorative shapes */}
        <Box
          position="absolute"
          top="10%"
          right="10%"
          width="300px"
          height="300px"
          borderRadius="full"
          bgGradient="linear(135deg, rgba(139,92,246,0.1) 0%, rgba(236,72,153,0.1) 100%)"
          filter="blur(60px)"
          animation={`${float} 6s ease-in-out infinite`}
        />
        <Box
          position="absolute"
          bottom="20%"
          left="5%"
          width="200px"
          height="200px"
          borderRadius="full"
          bgGradient="linear(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.1) 100%)"
          filter="blur(40px)"
          animation={`${float} 8s ease-in-out infinite 2s`}
        />

        <Container maxW="container.xl" py={{ base: 12, md: 20 }} position="relative">
          <Stack
            align="center"
            spacing={{ base: 10, md: 16 }}
            direction={{ base: "column", lg: "row" }}
          >
            {/* Left: Hero Text */}
            <Stack flex={1} spacing={{ base: 6, md: 8 }} maxW="600px">
              <Heading
                lineHeight={1.1}
                fontWeight={800}
                fontSize={{ base: "3xl", sm: "4xl", md: "5xl", lg: "6xl" }}
                fontFamily="heading"
              >
                <Text as="span" color="text.primary">
                  Stop applying everywhere.
                </Text>
                <br />
                <Text
                  as="span"
                  fontSize={{ base: "2xl", sm: "3xl", md: "4xl", lg: "5xl" }}
                  bgGradient="linear(to-r, primary.500, secondary.500)"
                  bgClip="text"
                >
                  Start applying smarter.
                </Text>
              </Heading>
              <Text color="text.secondary" fontSize={{ base: "md", md: "lg" }} lineHeight="relaxed">
                OnlyJobs matches you with jobs based on your actual experience and
                preferences — not keyword spam. Get a{" "}
                <Text as="span" fontWeight="bold" color="primary.600">
                  confidence score
                </Text>{" "}
                for each match so you know where to focus.
              </Text>
              <Text color="text.tertiary" fontSize="sm">
                Built by a dev who was tired of the same broken job search. No
                auto-apply, no spray-and-pray. Just smarter matching.
              </Text>
            </Stack>

            {/* Right: Login Form */}
            <Flex
              flex={1}
              justify="center"
              align="center"
              direction="column"
              width={{ base: "100%", lg: "auto" }}
            >
              <Box
                as="form"
                onSubmit={handleSubmit}
                p={8}
                borderRadius="2xl"
                bg="surface.card"
                boxShadow="elevated"
                border="1px solid"
                borderColor="surface.border"
                width={{ base: "100%", sm: "400px" }}
              >
                <VStack spacing={5}>
                  <Heading size="md" fontFamily="heading" textAlign="center">
                    Login or Sign up
                  </Heading>

                  {/* Free credits badge */}
                  <HStack
                    px={4}
                    py={2}
                    borderRadius="full"
                    bg="secondary.50"
                    border="1px solid"
                    borderColor="secondary.200"
                  >
                    <Box as={TbSparkles} color="secondary.500" animation={`${pulse} 2s infinite`} />
                    <Text fontSize="sm" fontWeight="semibold" color="secondary.700">
                      Start with $2 free credit
                    </Text>
                  </HStack>

                  <Input
                    type="email"
                    name="email"
                    placeholder="Email"
                    size="lg"
                    onChange={(e) => setEmail(e.target.value)}
                    isInvalid={fieldError}
                    borderRadius="xl"
                  />
                  <Input
                    type="password"
                    name="password"
                    placeholder="Password"
                    size="lg"
                    onChange={(e) => setPassword(e.target.value)}
                    isInvalid={fieldError}
                    borderRadius="xl"
                  />
                  <Box width="100%" textAlign="right">
                    <Link href="/forgot-password">
                      <Text
                        fontSize="sm"
                        color="primary.500"
                        cursor="pointer"
                        fontWeight="medium"
                        _hover={{ textDecoration: "underline" }}
                      >
                        Forgot Password?
                      </Text>
                    </Link>
                  </Box>
                  <Button
                    type="submit"
                    width="100%"
                    size="lg"
                    bgGradient="linear(135deg, primary.500, secondary.500)"
                    color="white"
                    fontWeight="bold"
                    borderRadius="xl"
                    isDisabled={loading}
                    isLoading={loading}
                    loadingText="Processing..."
                    _hover={{
                      bgGradient: "linear(135deg, primary.600, secondary.600)",
                      transform: "translateY(-1px)",
                      boxShadow: "button",
                    }}
                    _active={{
                      transform: "scale(0.98)",
                    }}
                  >
                    Get started
                  </Button>
                  <Text fontSize="xs" color="text.tertiary" textAlign="center" lineHeight="tall">
                    By proceeding, you consent to having your personal information
                    processed. OnlyJobs won&apos;t share your data directly, but uses AI to parse your information.
                  </Text>
                </VStack>
              </Box>

              {/* Product Hunt Badge */}
              <Box mt={6} textAlign="center">
                <a
                  href="https://www.producthunt.com/products/onlyjobs-beta?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-onlyjobs-beta"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    alt="OnlyJobs [BETA] - Daily job matcher | Product Hunt"
                    width="200"
                    height="43"
                    src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1058051&theme=light&t=1767616322906"
                    style={{ display: "block", margin: "0 auto" }}
                  />
                </a>
              </Box>
            </Flex>
          </Stack>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Container maxW="container.xl" py={{ base: 16, md: 24 }}>
        <VStack spacing={{ base: 10, md: 16 }}>
          <VStack spacing={4} textAlign="center">
            <Badge
              px={4}
              py={1}
              borderRadius="full"
              bg="primary.100"
              color="primary.700"
              fontWeight="semibold"
              fontSize="sm"
            >
              How It Works
            </Badge>
            <Heading
              as="h2"
              size="xl"
              fontFamily="heading"
              color="text.primary"
            >
              Smart matching in three steps
            </Heading>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 6, md: 10 }} width="100%">
            {/* Feature 1 */}
            <Box
              p={8}
              borderRadius="2xl"
              bg="surface.card"
              border="1px solid"
              borderColor="surface.border"
              textAlign="center"
              transition="all 0.2s ease"
              _hover={{
                transform: "translateY(-4px)",
                boxShadow: "cardHover",
                borderColor: "primary.200",
              }}
            >
              <Box
                mx="auto"
                mb={5}
                p={4}
                borderRadius="2xl"
                bg="primary.50"
                display="inline-flex"
              >
                <FiUpload size={32} color="#8B5CF6" />
              </Box>
              <Heading size="md" mb={3} fontFamily="heading">
                Upload Once, Done
              </Heading>
              <Text color="text.secondary" fontSize="sm" lineHeight="relaxed">
                Upload your CV and{" "}
                <Text as="span" fontWeight="bold" color="primary.600">
                  we handle the rest
                </Text>
                . AI parses your experience and asks follow-up questions conversationally.
              </Text>
            </Box>

            {/* Feature 2 */}
            <Box
              p={8}
              borderRadius="2xl"
              bg="surface.card"
              border="1px solid"
              borderColor="surface.border"
              textAlign="center"
              transition="all 0.2s ease"
              _hover={{
                transform: "translateY(-4px)",
                boxShadow: "cardHover",
                borderColor: "primary.200",
              }}
            >
              <Box
                mx="auto"
                mb={5}
                p={4}
                borderRadius="2xl"
                bg="secondary.50"
                display="inline-flex"
              >
                <FiZap size={32} color="#F97316" />
              </Box>
              <Heading size="md" mb={3} fontFamily="heading">
                Fresh Listings, Zero Noise
              </Heading>
              <Text color="text.secondary" fontSize="sm" lineHeight="relaxed">
                Jobs aggregated daily from multiple platforms. Vague and shady listings filtered out — only see{" "}
                <Text as="span" fontWeight="bold" color="secondary.600">
                  what&apos;s worth your time
                </Text>
                .
              </Text>
            </Box>

            {/* Feature 3 */}
            <Box
              p={8}
              borderRadius="2xl"
              bg="surface.card"
              border="1px solid"
              borderColor="surface.border"
              textAlign="center"
              transition="all 0.2s ease"
              _hover={{
                transform: "translateY(-4px)",
                boxShadow: "cardHover",
                borderColor: "primary.200",
              }}
            >
              <Box
                mx="auto"
                mb={5}
                p={4}
                borderRadius="2xl"
                bg="accent.50"
                display="inline-flex"
              >
                <FiTarget size={32} color="#3B82F6" />
              </Box>
              <Heading size="md" mb={3} fontFamily="heading">
                Match Scores You Trust
              </Heading>
              <Text color="text.secondary" fontSize="sm" lineHeight="relaxed">
                Every job comes with a{" "}
                <Text as="span" fontWeight="bold" color="accent.600">
                  confidence score and reasoning
                </Text>
                . Prioritize applications based on data, not guesswork.
              </Text>
            </Box>
          </SimpleGrid>
        </VStack>
      </Container>

      <Footer />
    </Box>
  );
}
