import Link from "next/link";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Divider,
  Button,
} from "@chakra-ui/react";
import { SEO } from "@/components/SEO";
import { JsonLd } from "@/components/JsonLd";
import { Footer } from "@/components/Footer";

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://onlyjobs.app/how-it-works#webpage",
      url: "https://onlyjobs.app/how-it-works",
      name: "How OnlyJobs Matching Works (and What It Costs) | OnlyJobs",
      description:
        "How OnlyJobs matches you: open-ended Q&A, one daily run, and only jobs above your threshold - each with a score, why it fits, and what didn't. No subscription.",
      inLanguage: "en-US",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://onlyjobs.app/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "How it works",
          item: "https://onlyjobs.app/how-it-works",
        },
      ],
    },
  ],
};

const FAQS = [
  {
    q: "Is there a subscription?",
    a: "No. It’s a prepaid wallet. You start with $2 free (about 6 match days), and after that you pay $0.30 only on days a match clears your threshold. Pause any time.",
  },
  {
    q: "How does it get to know me?",
    a: "You upload your resume, then answer open-ended questions by voice or text about your work and what you want. It keeps asking follow-ups, so it learns things a resume never captures.",
  },
  {
    q: "Are the jobs remote?",
    a: "Mainly remote, plus some hybrid. It covers tech and non-tech roles. It makes no on-site claims.",
  },
  {
    q: "Does it apply to jobs for me?",
    a: "No. There’s no auto-apply. You get the match, the reasons, what didn’t fit, and drafted answers, and you decide.",
  },
  {
    q: "What does “what didn’t fit” mean?",
    a: "Every match tells you not just why a job fits, but what you might not like about it and why the score isn’t higher. It’s how you can tell it understood you, and it saves you from applying to jobs you’d quit in six months.",
  },
  {
    q: "What if I get no matches for a few days?",
    a: "You pay nothing on those days. If it keeps happening, lower your threshold a little or broaden your preferences.",
  },
  {
    q: "How is it different from an AI job copilot?",
    a: "Most AI job tools are monthly subscriptions built around applying to more jobs. OnlyJobs is the opposite: fewer, explained matches, paid only on days it finds you one.",
  },
  {
    q: "Who makes OnlyJobs?",
    a: "OnlyJobs is operated by Aurora Designs LLP, based in Bangalore, India, built for US job seekers.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <SEO
        title="How OnlyJobs Matching Works (and What It Costs) | OnlyJobs"
        description="How OnlyJobs matches you: open-ended Q&A, one daily run, and only jobs above your threshold - each with a score, why it fits, and what didn't. No subscription."
        canonical="/how-it-works"
        ogType="article"
        ogTitle="How OnlyJobs matching works, in plain terms"
        ogDescription="Open-ended Q&A, one daily run, and only the jobs above your bar - each with why it fits and what didn't. No subscription; pay only on match days."
      />
      <JsonLd data={JSON_LD} />

      <Container maxW="container.md" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <Box as="nav" aria-label="Breadcrumb" mb={4}>
          <HStack spacing={1} fontSize="sm">
            <Link href="/">Home</Link>
            <Text as="span" color="gray.400" px={1}>
              &rsaquo;
            </Text>
            <Text as="span" color="gray.700">
              How it works
            </Text>
          </HStack>
        </Box>

        <VStack align="start" spacing={8} w="full">
          <Heading as="h1" size="xl">
            How OnlyJobs matching works (and what it costs)
          </Heading>

          <Text>
            OnlyJobs is an AI job matcher, not a job board. Instead of a giant searchable feed, it
            learns who you are, checks the day&apos;s jobs once a day, and sends you only the few
            worth your time - each with a score, why it fits, and what didn&apos;t. No subscription;
            you pay only on days a match clears your bar.
          </Text>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={4}>
              The basics
            </Heading>
            <VStack align="start" spacing={2} w="full">
              <Text>
                <strong>What it is:</strong> an AI job matcher for US seekers (not a job board).
              </Text>
              <Text>
                <strong>Coverage:</strong> mainly remote roles, plus hybrid; tech and non-tech.
              </Text>
              <Text>
                <strong>Profiling:</strong> open-ended Q&amp;A by voice or text - work anecdotes
                and culture preferences.
              </Text>
              <Text>
                <strong>Cadence:</strong> once a day. No auto-apply - you review every match.
              </Text>
              <Text>
                <strong>Pricing:</strong> prepaid wallet; $2 free to start (about 6 match days);
                $0.30 only on days at least one match clears your threshold; no subscription.
              </Text>
              <Text>
                <strong>Operated by:</strong> Aurora Designs LLP, Bangalore, India.
              </Text>
            </VStack>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={3}>
              1. Talk it through
            </Heading>
            <Text>
              Upload your resume, then answer an open-ended set of questions by voice or text. It
              keeps asking - problems you&apos;ve solved, work you loved, a job you left and why,
              how you like to be managed and measured. The more you share, the sharper your matches,
              and the more honest the &ldquo;what didn&apos;t fit&rdquo; becomes. You can come back
              and add more any time.
            </Text>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={3}>
              2. Set your preferences and deal-breakers
            </Heading>
            <Text>
              Tell it what actually matters: remote or hybrid, schedule, pace, pay floor, and how
              you want to be measured. In Settings you can also set your{" "}
              <strong>match-score threshold</strong> - the minimum score a job must clear to reach
              you (it starts at a sensible default). Raise it any time for fewer, stronger matches
              and fewer charged days.
            </Text>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={3}>
              3. The daily run
            </Heading>
            <Text>
              Once a day, OnlyJobs checks the jobs pulled that day from its job sources - a curated
              set of quality remote boards, not a firehose - and scores each against your profile. It
              filters out vague and shady listings. Mainly remote, plus hybrid; tech and non-tech.
            </Text>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={3}>
              4. What reaches you
            </Heading>
            <Text mb={3}>Only jobs at or above your threshold are sent. Each match comes with:</Text>
            <VStack align="start" spacing={1} pl={4} mb={3}>
              <Text>
                - a <strong>match score</strong>, and
              </Text>
              <Text>
                - a short <strong>reasoning</strong> that tells you both why it fits you and what
                didn&apos;t - why it may not suit you, and why the score isn&apos;t higher.
              </Text>
            </VStack>
            <Text>
              When the listing has application questions, you also get{" "}
              <strong>drafted answers</strong> to them. There is <strong>no auto-apply</strong> -
              you decide what to apply to, and you apply on the employer&apos;s or source&apos;s
              site. Jobs below your threshold aren&apos;t sent in your daily brief, and you&apos;re
              not charged for them.
            </Text>
          </Box>

          <Divider />

          <Box w="full" id="pricing" scrollMarginTop="70px">
            <Heading as="h2" size="lg" mb={3}>
              5. What it costs
            </Heading>
            <VStack align="start" spacing={2} w="full">
              <Text>
                <strong>No subscription.</strong> It&apos;s a prepaid wallet.
              </Text>
              <Text>
                <strong>$2 free to start</strong> - about 6 match days. No card needed.
              </Text>
              <Text>
                <strong>$0.30 only on days</strong> at least one match clears your threshold,
                charged once that day. $0 on every other day.
              </Text>
              <Text>
                <strong>You&apos;re in control:</strong> raise your threshold for fewer, stronger
                matches (and fewer charged days), or pause any time.
              </Text>
              <Text>
                Top up <strong>$5, $10, or $20</strong> (about 16, 33, or 66 match days), or a
                custom amount. Funds don&apos;t expire.
              </Text>
            </VStack>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={4}>
              Definitions
            </Heading>
            <VStack align="start" spacing={3} w="full">
              <Text>
                <strong>Match day:</strong> a day when at least one job clears your threshold.
                You&apos;re charged $0.30 once on a match day, nothing on other days.
              </Text>
              <Text>
                <strong>Threshold:</strong> the minimum match score you set. Jobs below it are not
                sent and don&apos;t trigger a charge.
              </Text>
              <Text>
                <strong>What didn&apos;t fit:</strong> part of every match&apos;s reasoning - the
                reasons a role may not suit you, and why its score isn&apos;t higher, not just the
                good news.
              </Text>
              <Text>
                <strong>Not a job board:</strong> OnlyJobs doesn&apos;t publish public job listings
                or category pages. You get private, scored matches after profiling.
              </Text>
            </VStack>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={6}>
              Questions
            </Heading>
            <VStack align="start" spacing={6} w="full">
              {FAQS.map(({ q, a }) => (
                <Box key={q}>
                  <Heading as="h3" size="md" mb={2}>
                    {q}
                  </Heading>
                  <Text>{a}</Text>
                </Box>
              ))}
            </VStack>
          </Box>

          <Divider />

          <Box w="full" textAlign="center" py={4}>
            <Heading as="h2" size="lg" mb={3}>
              See a sample match report
            </Heading>
            <Text mb={5}>
              See how OnlyJobs presents a match - score, why it fits, and what didn&apos;t.
            </Text>
            <VStack spacing={3} align="center">
              <Button
                as="a"
                href="/sample-match-report"
                colorScheme="blue"
                size="lg"
              >
                See a sample match report &rarr;
              </Button>
              <Button
                as="a"
                href="/?utm_source=site&utm_medium=how-it-works&utm_content=cta#signup"
                colorScheme="green"
                size="lg"
              >
                Get my first matches, $2 free &rarr;
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>

      <Footer />
    </>
  );
}
