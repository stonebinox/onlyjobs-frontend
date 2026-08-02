import {
  Box,
  Center,
  Heading,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BriefEntry } from "@/components/Today/BriefEntry";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { createApiClient } from "@/lib/apiClient";
import { JobResult } from "@/types/JobResult";
import { User } from "@/types/User";
import { resolveMinScore, filterMatches } from "@/utils/today-selection";

const COUNT_WORDS: Record<number, string> = {
  1: "One",
  2: "Two",
  3: "Three",
  4: "Four",
  5: "Five",
};

const formatHeaderDate = (): string => {
  const today = new Date();
  const dayName = today.toLocaleDateString("en-GB", { weekday: "long" });
  const day = today.getDate();
  const month = today.toLocaleDateString("en-GB", { month: "long" });
  return `${dayName}, ${day} ${month}`;
};

const TodayPage = () => {
  const [allFiltered, setAllFiltered] = useState<JobResult[]>([]);
  const [displayJobs, setDisplayJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const auth = useAuth();
  const router = useRouter();
  const { getMatches, checkWalletBalance, getUserProfile } = createApiClient();

  useEffect(() => {
    if (!auth?.isReady) return;

    if (!auth?.isLoggedIn) {
      const returnTo = window.location.pathname + window.location.search;
      sessionStorage.setItem("onlyjobs_returnTo", returnTo);
      router.push(`/?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    const init = async () => {
      setLoading(true);
      try {
        const [userData, walletResult] = await Promise.all([
          getUserProfile(),
          checkWalletBalance(),
        ]);

        let resolvedUser: User | null = null;
        if (userData && !("error" in userData)) {
          resolvedUser = userData as User;
          setUser(resolvedUser);
        }

        if (walletResult && !("error" in walletResult)) {
          setWalletBalance(walletResult.balance);
        }

        const minScore = resolveMinScore(resolvedUser?.preferences?.minScore);
        const response = await getMatches(minScore);

        if (!response || "error" in response) return;

        // Filter before cap — never the other way around
        const filtered = filterMatches(response as JobResult[]);
        setAllFiltered(filtered);
        setDisplayJobs(filtered.slice(0, 5));
      } catch (err) {
        console.error("Error loading today page:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.isReady, auth?.isLoggedIn]);

  const handleSkipped = (matchId: string) => {
    setDisplayJobs((prev) => prev.filter((e) => e._id !== matchId));
    setAllFiltered((prev) => prev.filter((e) => e._id !== matchId));
  };

  // Compute days from cents — never float-divide dollars
  const walletDays =
    walletBalance !== null
      ? Math.floor(Math.round(walletBalance * 100) / 30)
      : null;
  const showWalletWarning = walletDays !== null && walletDays < 10;

  const countLabel =
    COUNT_WORDS[displayJobs.length] ?? String(displayJobs.length);

  // Jobs beyond the displayed five
  const moreCount = allFiltered.length - displayJobs.length;

  const headerDate = formatHeaderDate();

  return (
    <>
      <SEO
        title="Today | OnlyJobs"
        description="Your daily job brief"
        noindex
      />
      <DashboardLayout>
        <Box maxW="680px" mx="auto" py={{ base: 4, md: 8 }} px={{ base: 2, md: 0 }}>
          {loading ? (
            <Center py={20}>
              <Spinner size="lg" color="primary.400" />
            </Center>
          ) : (
            <VStack align="start" spacing={{ base: 6, md: 8 }}>
              {/* Header */}
              <Box>
                <Text fontSize="sm" color="text.tertiary" mb={1}>
                  {headerDate}
                </Text>
                <Heading
                  as="h1"
                  size="lg"
                  fontFamily="heading"
                  color="text.primary"
                >
                  {displayJobs.length > 0
                    ? `${countLabel} worth your time.`
                    : "Nothing new today."}
                </Heading>
                {showWalletWarning && walletBalance !== null && (
                  <Text fontSize="sm" color="text.tertiary" mt={1}>
                    ${walletBalance.toFixed(2)} left · about{" "}
                    {walletDays} {walletDays === 1 ? "day" : "days"}
                  </Text>
                )}
              </Box>

              {/* Entries */}
              {displayJobs.length > 0 ? (
                <>
                  {displayJobs.map((entry) => (
                    <BriefEntry
                      key={entry._id}
                      entry={entry}
                      onSkipped={handleSkipped}
                    />
                  ))}

                  {/* Footer */}
                  <Box pt={2}>
                    <Text color="text.secondary">
                      {"That's today."}
                      {moreCount > 0 && (
                        <>
                          {" "}
                          {moreCount === 1
                            ? "One more scored lower — "
                            : `${moreCount} more scored lower — `}
                          <NextLink href="/dashboard">
                            <Text
                              as="span"
                              color="primary.600"
                              fontWeight="medium"
                              cursor="pointer"
                              _hover={{ textDecoration: "underline" }}
                            >
                              open them if you want.
                            </Text>
                          </NextLink>
                        </>
                      )}
                    </Text>
                  </Box>
                </>
              ) : (
                /* Empty state — actionable, not a cron schedule */
                <Box
                  p={6}
                  borderRadius="2xl"
                  border="1px dashed"
                  borderColor="surface.border"
                  bg="surface.card"
                  width="100%"
                >
                  <Text color="text.secondary" mb={3}>
                    No new matches right now. Make sure your CV and Q&amp;A are
                    up to date — the better your profile, the more the system
                    has to work with.
                  </Text>
                  <NextLink href="/dashboard">
                    <Text
                      as="span"
                      color="primary.600"
                      fontWeight="medium"
                      fontSize="sm"
                      cursor="pointer"
                      _hover={{ textDecoration: "underline" }}
                    >
                      Go to dashboard →
                    </Text>
                  </NextLink>
                </Box>
              )}
            </VStack>
          )}
        </Box>
      </DashboardLayout>
    </>
  );
};

export default TodayPage;
