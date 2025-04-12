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
} from "@chakra-ui/react";
import Link from "next/link";
import styled from "styled-components";

import theme from "@/theme/theme";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

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

const ContactLink = styled(Link)`
  color: ${theme.colors.semantic.primary};
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
            <Heading size="md">OnlyJobs</Heading>
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
                Hopping between job boards?
              </Text>
              <br />
              <Text
                as={"span"}
                fontSize={{ base: "2xl", sm: "3xl", lg: "4xl" }}
                color={"brand.500"}
              >
                Let&apos;s do it <StyledText>intelligently</StyledText>.
              </Text>
            </Heading>
            <Text color={"gray.500"}>
              OnlyJobs is built by a single fullstack dev trying to help himself
              find a remote job. He&apos;s a user here, too. He built these
              based on his experience as an interviewee and interviewer.
            </Text>
            <Text color={"gray.500"}>
              If you&apos;re looking for a tool to automatically apply for you,
              this isn&apos;t it. You&apos;re an experienced dev. You don&apos;t
              need that. You need <StyledText>better</StyledText>.
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
            <form>
              <FormContainer>
                <Heading size="sm">Login or Sign up</Heading>
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
                  type="button"
                  variant={"solid"}
                  width="100%"
                  onClick={handleSubmit}
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
                Using AI the Smart Way
              </Heading>
              <Text>
                You{" "}
                <StyledText>
                  don&apos;t need to fill out your life&apos;s data
                </StyledText>{" "}
                anywhere. This uses AI to parse your CV and ask you follow up
                questions to get a better understanding of your skills and
                experience. Talk your way through it. It&apos;s that simple.
              </Text>
            </Box>
            <Box textAlign="center" p={5}>
              <Heading size="md" mb={4}>
                Job Listings Everyday
              </Heading>
              <Text>
                OnlyJobs aggregates job listings from various platforms once a
                day, ensuring you have access to the latest opportunities in one
                place. Vague, weird, shady, and inconsistent job listings are
                consolidated, cleaned up, and parsed for{" "}
                <StyledText>your benefit</StyledText>.
              </Text>
            </Box>
            <Box textAlign="center" p={5}>
              <Heading size="md" mb={4}>
                Smartest Matching
              </Heading>
              <Text>
                The AI-powered matching connects you with job listings that
                align with your skills and preferences. It assigns a{" "}
                <StyledText>
                  match confidence score along with it&apos;s reasoning
                </StyledText>{" "}
                to each job listing, helping you prioritize your applications.
                Completely customizable, too.
              </Text>
            </Box>
          </Stack>
        </VStack>
      </Container>

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
              © {new Date().getFullYear()} OnlyJobs. All rights reserved. &bull;
              &nbsp;
              <ContactLink
                href={`mailto:${"anoop"}.${"santhanam"}@${"gmail"}.${"com"}`}
                color="semantic.primary"
              >
                Contact me
              </ContactLink>
            </Text>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
