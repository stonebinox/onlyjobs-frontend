import { Box, Text, Badge, VStack } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

type Verdict = "Strong match" | "Mild match" | "Weak match" | "No match";

interface MatchScoreRingProps {
  score: number;
  verdict: Verdict;
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

const getVerdictColors = (verdict: Verdict) => {
  switch (verdict) {
    case "Strong match":
      return {
        stroke: "#22C55E",
        strokeGradient: "url(#strongGradient)",
        bg: "#DCFCE7",
        text: "#15803D",
        badge: "green",
      };
    case "Mild match":
      return {
        stroke: "#3B82F6",
        strokeGradient: "url(#mildGradient)",
        bg: "#DBEAFE",
        text: "#1D4ED8",
        badge: "blue",
      };
    case "Weak match":
      return {
        stroke: "#F59E0B",
        strokeGradient: "url(#weakGradient)",
        bg: "#FEF3C7",
        text: "#B45309",
        badge: "orange",
      };
    case "No match":
    default:
      return {
        stroke: "#EF4444",
        strokeGradient: "url(#noneGradient)",
        bg: "#FEE2E2",
        text: "#DC2626",
        badge: "red",
      };
  }
};

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
  const colors = getVerdictColors(verdict);
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
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="strongGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#16A34A" />
            </linearGradient>
            <linearGradient id="mildGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="weakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="noneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
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
            stroke={colors.strokeGradient}
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
              color={colors.text}
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
        colorScheme={colors.badge}
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
