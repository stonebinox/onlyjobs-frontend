import { Box, Text, Badge, VStack } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { VERDICT_COLORS, getVerdictColor, getVerdictRing } from "@/utils/verdict-colors";

interface MatchScoreRingProps {
  score: number;
  verdict: string;
  size?: "sm" | "md" | "lg";
}

const drawIn = keyframes`
  from {
    stroke-dashoffset: 283;
  }
  to {
    stroke-dashoffset: var(--dash-offset);
  }
`;

// SVG gradient IDs — implementation detail; no colour values
const GRADIENT_IDS: Record<string, string> = {
  "Strong match": "strongGradient",
  "Mild match":   "mildGradient",
  "Weak match":   "weakGradient",
  "No match":     "noneGradient",
};
const FALLBACK_GRADIENT_ID = "noneGradient";

const getSizeConfig = (size: "sm" | "md" | "lg") => {
  switch (size) {
    case "sm":
      return { boxSize: 60, strokeWidth: 6, fontSize: "lg", badgeSize: "xs" };
    case "lg":
      return { boxSize: 100, strokeWidth: 10, fontSize: "3xl", badgeSize: "sm" };
    case "md":
    default:
      return { boxSize: 80, strokeWidth: 8, fontSize: "2xl", badgeSize: "xs" };
  }
};

export const MatchScoreRing = ({
  score,
  verdict,
  size = "md",
}: MatchScoreRingProps) => {
  const ring = getVerdictRing(verdict);
  const { colorScheme: badge } = getVerdictColor(verdict);
  const gradientId = GRADIENT_IDS[verdict] ?? FALLBACK_GRADIENT_ID;
  const sizeConfig = getSizeConfig(size);

  // Calculate the stroke dash offset based on score (0-100)
  const circumference = 2 * Math.PI * 40; // radius = 40 (in viewBox of 100)
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <VStack spacing={1}>
      <Box
        position="relative"
        width={`${sizeConfig.boxSize}px`}
        height={`${sizeConfig.boxSize}px`}
      >
        {/* SVG Ring */}
        <Box
          as="svg"
          viewBox="0 0 100 100"
          width="100%"
          height="100%"
          transform="rotate(-90deg)"
        >
          {/* Gradient definitions — sourced from VERDICT_COLORS, no hex literals here */}
          <defs>
            {Object.entries(VERDICT_COLORS).map(([v, c]) => {
              const gId = GRADIENT_IDS[v] ?? FALLBACK_GRADIENT_ID;
              return (
                <linearGradient key={gId} id={gId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={c.gradient[0]} />
                  <stop offset="100%" stopColor={c.gradient[1]} />
                </linearGradient>
              );
            })}
          </defs>

          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={sizeConfig.strokeWidth}
          />

          {/* Progress circle */}
          <Box
            as="circle"
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={sizeConfig.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ "--dash-offset": dashOffset } as React.CSSProperties}
            animation={`${drawIn} 1s ease-out forwards`}
          />
        </Box>

        {/* Center content */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          textAlign="center"
          bg="surface.card"
          borderRadius="full"
          width={`${sizeConfig.boxSize - sizeConfig.strokeWidth * 3}px`}
          height={`${sizeConfig.boxSize - sizeConfig.strokeWidth * 3}px`}
          display="flex"
          alignItems="center"
          justifyContent="center"
          boxShadow="0 2px 10px rgba(0,0,0,0.08)"
        >
          <Box>
            <Text
              fontFamily="mono"
              fontSize={sizeConfig.fontSize}
              fontWeight="bold"
              color={ring.badgeText}
              lineHeight="1"
            >
              {score}
            </Text>
            <Text
              fontSize="xs"
              color="text.tertiary"
              fontWeight="medium"
            >
              %
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Verdict badge */}
      <Badge
        colorScheme={badge}
        fontSize={sizeConfig.badgeSize}
        px={2}
        py={0.5}
        borderRadius="full"
        fontWeight="semibold"
        textTransform="capitalize"
      >
        {verdict}
      </Badge>
    </VStack>
  );
};

export default MatchScoreRing;
