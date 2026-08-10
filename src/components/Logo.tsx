import { Heading } from "@chakra-ui/react";
import { PAPER, PENCIL } from "@/theme/palette";

export function Logo() {
  return (
    <Heading
      size="md"
      fontFamily="heading"
      fontWeight="bold"
      letterSpacing="-0.02em"
      aria-label="OnlyJobs"
    >
      <span style={{ color: PAPER }} data-testid="logo-only">Only</span>
      <span style={{ color: PENCIL[300] }} data-testid="logo-jobs">Jobs</span>
    </Heading>
  );
}
