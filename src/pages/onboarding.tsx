import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { EmailVerificationBanner } from "@/components/Dashboard/EmailVerificationBanner";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import { SEO } from "@/components/SEO";
import { CountrySelect } from "@/components/common/CountrySelect";
import { useAuth } from "@/contexts/AuthContext";
import { createApiClient } from "@/lib/apiClient";
import { User } from "@/types/User";
import { hasMeaningfulResume } from "@/utils/resumePredicate";

const ALLOWED_CV_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_CV_EXTENSIONS = [".pdf", ".docx"];

type TriggerResult = {
  ok: boolean;
  status: number;
  message?: string;
  reason?: string;
  retryAfterMinutes?: number;
  walletBalance?: number;
  required?: number;
  error?: string;
};

const OnboardingPage = () => {
  const auth = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { getUserProfile, updateUserProfile, uploadCV, triggerMatchForMe } = createApiClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [locationSaving, setLocationSaving] = useState(false);

  const [role, setRole] = useState("");
  const [years, setYears] = useState<string>("");
  const [stack, setStack] = useState("");
  const [saving, setSaving] = useState(false);

  const [cvUploading, setCvUploading] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<TriggerResult | null>(null);

  useEffect(() => {
    if (!auth?.isReady) return;
    if (!auth?.isLoggedIn) {
      router.push("/");
      return;
    }
    const init = async () => {
      setLoading(true);
      try {
        const userData = await getUserProfile();
        if (userData && !("error" in userData)) {
          setUser(userData as User);
          setCurrentLocation((userData as User).currentLocation || "");
        }
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.isReady, auth?.isLoggedIn]);

  const hasResume = hasMeaningfulResume(user?.resume);

  const handleSaveLocation = async (loc: string) => {
    setLocationSaving(true);
    try {
      await updateUserProfile(undefined, undefined, undefined, undefined, loc || null);
      const updated = await getUserProfile();
      if (updated && !("error" in updated)) {
        setUser(updated as User);
        setCurrentLocation(loc);
      }
    } finally {
      setLocationSaving(false);
    }
  };

  const handleQuickProfileSave = async () => {
    const roleTrimmed = role.trim();
    const stackTrimmed = stack.trim();

    const trimmedYears = years.trim();
    const yearsNum = trimmedYears === "" ? 0 : /^\d+$/.test(trimmedYears) ? parseInt(trimmedYears, 10) : NaN;
    if (isNaN(yearsNum) || yearsNum < 0 || yearsNum > 60) {
      toast({
        title: "Invalid years",
        description: "Please enter a valid number of years (0–60).",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    if (!roleTrimmed) {
      toast({
        title: "Role required",
        description: "Please enter your role or title.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    const summary =
      yearsNum === 0
        ? `${roleTrimmed}.`
        : `${roleTrimmed} with ${yearsNum} year${yearsNum === 1 ? "" : "s"} of experience.`;

    const rawSkills = stackTrimmed.split(",").map((s) => s.trim()).filter(Boolean);
    const seen = new Set<string>();
    const skills = rawSkills.filter((s) => {
      const k = s.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    setSaving(true);
    try {
      await updateUserProfile({ summary, ...(skills.length > 0 ? { skills } : {}) });
      const updated = await getUserProfile();
      if (updated && !("error" in updated)) {
        setUser(updated as User);
      }
      toast({
        title: "Profile saved",
        description: "Your quick profile has been saved.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: "Save failed",
        description: "Something went wrong. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCVFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!ALLOWED_CV_TYPES.includes(file.type) && !ALLOWED_CV_EXTENSIONS.includes(ext)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF or DOCX file.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setCvUploading(true);
    try {
      const result = await uploadCV(file);
      if (result && "error" in result) {
        toast({
          title: "Upload failed",
          description: String(result.error),
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        return;
      }
      const updated = await getUserProfile();
      if (updated && !("error" in updated)) {
        setUser(updated as User);
      }
      toast({
        title: "CV uploaded",
        description: "Your CV has been updated.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: "Upload failed",
        description: "Something went wrong. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setCvUploading(false);
    }
  };

  const handleTrigger = async () => {
    if (triggering) return;
    setTriggering(true);
    setTriggerResult(null);
    try {
      const result = await triggerMatchForMe();
      setTriggerResult(result);
    } finally {
      setTriggering(false);
    }
  };

  const renderTriggerResult = (result: TriggerResult) => {
    if (result.ok && result.status === 202) {
      return (
        <Text color="green.600" fontSize="sm">
          {"We're finding your first matches — they'll appear in your brief. "}
          <NextLink href="/today">
            <Text as="span" color="primary.600" fontWeight="medium" _hover={{ textDecoration: "underline" }}>
              Go to dashboard →
            </Text>
          </NextLink>
        </Text>
      );
    }
    if (result.reason === "unverified") {
      return (
        <Text color="orange.600" fontSize="sm">
          Verify your email first before running matching.
        </Text>
      );
    }
    if (result.reason === "no_resume") {
      return (
        <Text color="orange.600" fontSize="sm">
          Add your CV or complete your quick profile above.
        </Text>
      );
    }
    if (result.reason === "matching_disabled") {
      return (
        <Text color="text.secondary" fontSize="sm">
          {"Matching is turned off — enable it in "}
          <NextLink href="/settings">
            <Text as="span" color="primary.600" fontWeight="medium" _hover={{ textDecoration: "underline" }}>
              Settings
            </Text>
          </NextLink>
          .
        </Text>
      );
    }
    if (result.reason === "insufficient_balance") {
      return (
        <Text color="text.secondary" fontSize="sm">
          {"Top up your wallet to run matching. "}
          <NextLink href="/wallet">
            <Text as="span" color="primary.600" fontWeight="medium" _hover={{ textDecoration: "underline" }}>
              Go to wallet →
            </Text>
          </NextLink>
          {result.walletBalance !== undefined && result.required !== undefined && (
            <Text as="span" color="text.tertiary">
              {` (balance: $${result.walletBalance.toFixed(2)}, required: $${result.required.toFixed(2)})`}
            </Text>
          )}
        </Text>
      );
    }
    if (result.status === 429) {
      return (
        <Text color="text.secondary" fontSize="sm">
          {`You just ran matching — try again in ${result.retryAfterMinutes} min.`}
        </Text>
      );
    }
    if (result.status === 0 || result.status === 502 || result.status === 503) {
      return (
        <Text color="text.secondary" fontSize="sm">
          {"We couldn't start an instant run right now — your first matches will be in your next daily brief."}
        </Text>
      );
    }
    return (
      <Text color="red.600" fontSize="sm">
        {result.message || "Something went wrong. Please try again."}
      </Text>
    );
  };

  if (!auth?.isReady) return null;
  if (!auth?.isLoggedIn) return null;

  return (
    <>
      <SEO title="Get started — OnlyJobs" description="Set up your profile and find your first matches." canonical="/onboarding" />
      <DashboardLayout>
        {loading ? (
          <Container maxW="container.md" py={12}>
            <Text color="text.secondary">Loading…</Text>
          </Container>
        ) : (
          <Container maxW="container.md" py={{ base: 8, md: 12 }}>
            <VStack spacing={8} align="stretch">
              <EmailVerificationBanner
                isVerified={!!user?.isVerified}
                email={user?.email}
              />

              <Box>
                <Heading size="lg" fontFamily="heading" mb={2}>
                  Get started
                </Heading>
                <NextLink href="/today">
                  <Text
                    as="span"
                    color="primary.600"
                    fontSize="sm"
                    fontWeight="medium"
                    cursor="pointer"
                    _hover={{ textDecoration: "underline" }}
                  >
                    Go to dashboard →
                  </Text>
                </NextLink>
              </Box>

              {!hasResume && (
                <Stack direction={{ base: "column", md: "row" }} spacing={6} align="flex-start">
                  {/* Option A: Quick Profile */}
                  <Box
                    flex={1}
                    p={6}
                    borderRadius="2xl"
                    border="1px solid"
                    borderColor="surface.border"
                    bg="surface.card"
                  >
                    <Heading size="sm" fontFamily="heading" mb={4}>
                      Quick profile
                    </Heading>
                    <VStack spacing={3}>
                      <Input
                        aria-label="Role or title"
                        placeholder="Your role or title (e.g. Senior Frontend Engineer)"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        borderRadius="xl"
                      />
                      <Input
                        aria-label="Years of experience"
                        type="number"
                        placeholder="Years of experience (e.g. 5)"
                        value={years}
                        min={0}
                        onChange={(e) => setYears(e.target.value)}
                        borderRadius="xl"
                      />
                      <Input
                        aria-label="Tech stack"
                        placeholder="Tech stack (e.g. React, TypeScript, Node.js)"
                        value={stack}
                        onChange={(e) => setStack(e.target.value)}
                        borderRadius="xl"
                      />
                      <Button
                        width="100%"
                        bg="primary.500"
                        color="white"
                        borderRadius="xl"
                        isLoading={saving}
                        loadingText="Saving…"
                        onClick={handleQuickProfileSave}
                        _hover={{ bg: "primary.600" }}
                      >
                        Save profile
                      </Button>
                    </VStack>
                  </Box>

                  {/* Option B: Drop your CV */}
                  <Box
                    flex={1}
                    p={6}
                    borderRadius="2xl"
                    border="1px solid"
                    borderColor="surface.border"
                    bg="surface.card"
                  >
                    <Heading size="sm" fontFamily="heading" mb={4}>
                      Drop your CV
                    </Heading>
                    <VStack spacing={3}>
                      <input
                        type="file"
                        ref={cvInputRef}
                        accept=".pdf,.docx"
                        onChange={handleCVFileSelect}
                        style={{ display: "none" }}
                      />
                      <Button
                        width="100%"
                        bg="primary.500"
                        color="white"
                        borderRadius="xl"
                        isLoading={cvUploading}
                        loadingText="Uploading…"
                        onClick={() => cvInputRef.current?.click()}
                        _hover={{ bg: "primary.600" }}
                      >
                        Upload CV
                      </Button>
                      <Text fontSize="xs" color="text.tertiary">
                        PDF or DOCX
                      </Text>
                    </VStack>
                  </Box>
                </Stack>
              )}

              {/* Where are you based? */}
              <Box
                p={6}
                borderRadius="2xl"
                border="1px solid"
                borderColor="surface.border"
                bg="surface.card"
              >
                <VStack spacing={3} align="flex-start">
                  <Heading size="sm" fontFamily="heading">
                    Where are you based?
                  </Heading>
                  <Text fontSize="sm" color="text.secondary">
                    Your physical location helps us assess remote eligibility more accurately.
                  </Text>
                  <CountrySelect
                    value={currentLocation}
                    onChange={(val) => setCurrentLocation(val)}
                    placeholder="Select your country"
                  />
                  <Button
                    size="sm"
                    bg="primary.500"
                    color="white"
                    borderRadius="xl"
                    isLoading={locationSaving}
                    loadingText="Saving…"
                    isDisabled={!currentLocation || locationSaving}
                    onClick={() => handleSaveLocation(currentLocation)}
                    _hover={{ bg: "primary.600" }}
                  >
                    Save location
                  </Button>
                  {user?.currentLocation && (
                    <Text fontSize="xs" color="text.tertiary">
                      Saved: {user.currentLocation}
                    </Text>
                  )}
                </VStack>
              </Box>

              {/* Find my first matches — always shown */}
              <Box
                p={6}
                borderRadius="2xl"
                border="1px solid"
                borderColor="surface.border"
                bg="surface.card"
              >
                <VStack spacing={3} align="flex-start">
                  <Heading size="sm" fontFamily="heading">
                    Find my first matches
                  </Heading>
                  <Button
                    bg="primary.500"
                    color="white"
                    borderRadius="xl"
                    isDisabled={!hasResume || !user?.currentLocation}
                    isLoading={triggering}
                    loadingText="Finding matches…"
                    onClick={handleTrigger}
                    _hover={{ bg: "primary.600" }}
                    _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                  >
                    Find my first matches
                  </Button>
                  {hasResume && !user?.currentLocation && (
                    <Text fontSize="xs" color="text.tertiary">
                      Save your location above to enable matching.
                    </Text>
                  )}
                  <Text fontSize="sm" color="text.secondary">
                    $0.30 only if we find matches
                  </Text>
                  <Text fontSize="xs" color="text.tertiary">
                    {"You're not charged if we don't find any."}
                  </Text>
                  {triggerResult && renderTriggerResult(triggerResult)}
                </VStack>
              </Box>
            </VStack>
          </Container>
        )}
      </DashboardLayout>
    </>
  );
};

export default OnboardingPage;
