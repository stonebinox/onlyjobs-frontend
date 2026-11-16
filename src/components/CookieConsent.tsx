import { Box, Button, Flex, Text, Link } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { isConsentBannerShowing, recordConsentDismissed } from "@/utils/cookieConsent";

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isConsentBannerShowing()) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    recordConsentDismissed();
  };

  if (!visible) return null;

  return (
    <Box
      position="fixed"
      bottom={4}
      left={4}
      right={4}
      zIndex={9999}
      maxW="600px"
      mx="auto"
      bg="surface.card"
      border="1px solid"
      borderColor="surface.border"
      borderRadius="2xl"
      p={4}
      boxShadow="elevated"
    >
      <Flex align="center" gap={4} flexWrap={{ base: "wrap", md: "nowrap" }}>
        <Text fontSize="sm" color="text.secondary" flex={1}>
          We use cookies and local storage to keep you signed in and improve your experience. We also use advertising measurement tools (the Meta Pixel and Conversions API) to see whether our ads lead to sign-ups.{" "}
          <Link href="/privacy-policy" color="primary.500" fontWeight="medium">
            Privacy policy
          </Link>
          .
        </Text>
        <Button
          size="sm"
          colorScheme="blue"
          borderRadius="xl"
          onClick={dismiss}
          flexShrink={0}
        >
          Got it
        </Button>
      </Flex>
    </Box>
  );
};
