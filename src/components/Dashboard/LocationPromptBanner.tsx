import { useState, useEffect } from "react";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Button,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CountrySelect } from "@/components/common/CountrySelect";
import { trackEvent } from "@/utils/analytics";

interface LocationPromptBannerProps {
  onSave: (location: string) => Promise<boolean>;
}

export const LocationPromptBanner = ({ onSave }: LocationPromptBannerProps) => {
  const [dismissed, setDismissed] = useState(false);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("current_location_prompt_shown");
  }, []);

  if (dismissed) return null;

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    try {
      const success = await onSave(selected);
      if (success) {
        trackEvent("current_location_saved");
      } else {
        setSaveError("Failed to save. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    trackEvent("current_location_dismissed");
  };

  return (
    <Alert
      status="info"
      borderRadius="md"
      mb={4}
      flexDirection="column"
      alignItems="flex-start"
    >
      <HStack w="100%" justify="space-between" mb={2}>
        <HStack>
          <AlertIcon />
          <AlertTitle>Where are you based?</AlertTitle>
        </HStack>
        <Button size="xs" variant="ghost" onClick={handleDismiss}>
          Dismiss
        </Button>
      </HStack>
      <AlertDescription w="100%">
        <VStack spacing={3} align="stretch">
          <Text fontSize="sm">
            Your location helps us assess remote eligibility. It stays separate from your preferred job locations.
          </Text>
          <HStack>
            <Box flex={1}>
              <CountrySelect
                value={selected}
                onChange={setSelected}
                placeholder="Select your country"
              />
            </Box>
            <Button
              colorScheme="blue"
              size="sm"
              isDisabled={!selected}
              isLoading={saving}
              loadingText="Saving…"
              onClick={handleSave}
            >
              Save
            </Button>
          </HStack>
          {saveError && (
            <Text fontSize="sm" color="red.500">
              {saveError}
            </Text>
          )}
        </VStack>
      </AlertDescription>
    </Alert>
  );
};
