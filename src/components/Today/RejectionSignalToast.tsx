import { Box, Button, Text, useToast } from "@chakra-ui/react";
import { useState } from "react";

import { createApiClient } from "@/lib/apiClient";
import { RejectionSignalSummary } from "@/types/RejectionSignalSummary";

const REVOKE_ERROR = "Couldn't update your hidden companies. Please try again.";

export const isCompanyScope = (signal: RejectionSignalSummary): boolean =>
  signal.scope === "company" || signal.scope === "company_role";

const formatBlockedUntil = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export type RevokeBlock = (
  matchId: string
) => Promise<{ error?: string } | undefined>;

export const signalMessage = (signal: RejectionSignalSummary): string => {
  if (signal.scope === "role" || signal.scope === "attribute") {
    return "Got it - we'll score similar jobs lower.";
  }
  const until =
    signal.duration === "temporary" && signal.blockedUntil
      ? `until ${formatBlockedUntil(signal.blockedUntil)}`
      : "permanently";
  return signal.scope === "company_role"
    ? `Hiding this role at ${signal.company} ${until}.`
    : `Hiding ${signal.company} ${until}.`;
};

// Message plus optional "Keep showing <company>" action. On success the text
// swaps to a confirmation; on failure it shows the error and leaves state alone.
export const SignalMessage = ({
  message,
  company,
  matchId,
  revokeBlock,
  onClose,
}: {
  message: string;
  company: string | null;
  matchId: string;
  revokeBlock: RevokeBlock;
  onClose: () => void;
}) => {
  const [text, setText] = useState(message);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleKeepShowing = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await revokeBlock(matchId);
      if (result && "error" in result && result.error) {
        setText(result.error);
        return;
      }
      setText(`OK - ${company} will keep showing up.`);
      setDone(true);
    } catch {
      setText(REVOKE_ERROR);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Text fontSize="sm" flex={1} color="gray.600">
        {text}
      </Text>
      {company && !done && (
        <Button
          size="sm"
          variant="ghost"
          colorScheme="blue"
          isLoading={busy}
          onClick={handleKeepShowing}
        >
          Keep showing {company}
        </Button>
      )}
    </>
  );
};

const SignalToast = (props: {
  message: string;
  company: string | null;
  matchId: string;
  revokeBlock: RevokeBlock;
  onClose: () => void;
}) => (
  <Box
    bg="white"
    border="1px solid"
    borderColor="gray.200"
    borderRadius="lg"
    p={3}
    display="flex"
    alignItems="center"
    gap={3}
    shadow="md"
  >
    <SignalMessage {...props} />
  </Box>
);

// Toast for a rejection signal with no skip Undo. Company blocks get a
// "Keep showing" action; other scopes are informational.
export const useRejectionSignalToast = () => {
  const toast = useToast();
  const { revokeBlock } = createApiClient();

  return (matchId: string, signal?: RejectionSignalSummary | null) => {
    if (!signal) return;
    toast({
      duration: 6000,
      isClosable: true,
      render: ({ onClose }) => (
        <SignalToast
          message={signalMessage(signal)}
          company={isCompanyScope(signal) ? signal.company : null}
          matchId={matchId}
          revokeBlock={revokeBlock}
          onClose={onClose}
        />
      ),
    });
  };
};
