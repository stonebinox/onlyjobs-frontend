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
      "@id": "https://onlyjobs.app/ai-job-tools#webpage",
      url: "https://onlyjobs.app/ai-job-tools",
      name: "How OnlyJobs Is Different From Other AI Job Tools | OnlyJobs",
      description:
        "Many AI job tools are monthly subscriptions built around applying to more. OnlyJobs sends a few explained matches and charges only on days a match clears your bar.",
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
          name: "AI job tools",
          item: "https://onlyjobs.app/ai-job-tools",
        },
      ],
    },
  ],
};

const QUESTIONS = [
  {
    q: "Is there a subscription?",
    a: "No. It’s a prepaid wallet - $2 free to start, then $0.30 only on days at least one match clears your threshold. Pause any time.",
  },
  {
    q: "Does it auto-apply?",
    a: "No. You get the matches and the reasoning, and you decide what to apply to.",
  },
  {
    q: "Are the jobs remote?",
    a: "Mainly remote, plus some hybrid, across tech and non-tech roles, for job seekers in the US.",
  },
];

export default function AiJobToolsPage() {
  return (
    <>
      <SEO
        title="How OnlyJobs Is Different From Other AI Job Tools | OnlyJobs"
        description="Many AI job tools are monthly subscriptions built around applying to more. OnlyJobs sends a few explained matches and charges only on days a match clears your bar."
        canonical="/ai-job-tools"
        ogType="article"
        ogTitle="A different kind of AI job tool: no subscription, explained matches"
        ogDescription="Fewer, explained matches - with what didn't fit - and you pay only on days a match clears your bar. No subscription, no auto-apply."
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
              AI job tools
            </Text>
          </HStack>
        </Box>

        <VStack align="start" spacing={8} w="full">
          <Heading as="h1" size="xl">
            How OnlyJobs is different from other AI job tools
          </Heading>

          <Text>
            Plenty of AI tools now promise to help your job search. Many follow a common pattern: a
            monthly subscription, and help applying to more jobs - sometimes automatically. OnlyJobs
            is built differently. Here&apos;s how, plainly.
          </Text>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={3}>
              No subscription - you pay only when it helps
            </Heading>
            <Text>
              A monthly subscription costs the same whether or not it finds you anything. OnlyJobs
              is priced the other way around. It&apos;s a prepaid wallet: on any day it finds you a
              match that clears your bar, it charges a flat $0.30 - and on days nothing clears, you
              pay nothing. You start with $2 of free credit (about six match days, no card needed),
              and if you land a job you can switch matching off and keep your balance for next time.
            </Text>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={3}>
              Fewer matches, not more volume
            </Heading>
            <Text>
              Many tools are built around volume - large feeds and, in some cases, automatic
              applying. OnlyJobs sends a short daily list of jobs above your threshold instead.
              There&apos;s no auto-apply; you review every match and apply yourself.
            </Text>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={3}>
              Each match is explained
            </Heading>
            <Text>
              A match score on its own doesn&apos;t tell you much. OnlyJobs gives each match a short
              reasoning that covers both why it fits you and what didn&apos;t - what you might not
              like about it, and why the score isn&apos;t higher. It&apos;s one short explanation,
              not a form to read.
            </Text>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={3}>
              It gets to know you beyond your resume
            </Heading>
            <Text>
              OnlyJobs profiles you with open-ended questions, by voice or text - your work stories
              and what you&apos;re looking for, the nuance a resume doesn&apos;t capture. Once a day
              it checks jobs from a curated set of quality remote boards and matches against all of
              it.
            </Text>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={3}>
              Coverage
            </Heading>
            <Text>
              Built for job seekers in the US. Mainly remote roles, plus some hybrid. Tech and
              non-tech alike - support, finance, marketing, sales, operations, admin, and more.
            </Text>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={3}>
              Who it&apos;s for
            </Heading>
            <Text>
              If you want a tool that maximizes how many applications you send, OnlyJobs isn&apos;t
              that. If you want fewer, explained matches without a subscription, it&apos;s built for
              that.
            </Text>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={6}>
              Questions
            </Heading>
            <VStack align="start" spacing={6} w="full">
              {QUESTIONS.map(({ q, a }) => (
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
            <VStack spacing={3} align="center">
              <Button as="a" href="/sample-match-report" colorScheme="blue" size="lg">
                See a sample match report &rarr;
              </Button>
              <Button
                as="a"
                href="/?utm_source=site&utm_medium=ai-job-tools&utm_content=cta#signup"
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
