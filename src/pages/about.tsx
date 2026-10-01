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

const PAGE_TITLE = "About OnlyJobs: Why I Built It | OnlyJobs";

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": "https://onlyjobs.app/about#webpage",
      url: "https://onlyjobs.app/about",
      name: PAGE_TITLE,
      mainEntity: { "@id": "https://onlyjobs.app/about#person" },
      about: { "@id": "https://onlyjobs.app/#organization" },
    },
    {
      "@type": "Person",
      "@id": "https://onlyjobs.app/about#person",
      name: "Anoop Santhanam",
      jobTitle: "Founder",
      url: "https://onlyjobs.app/about",
      worksFor: {
        "@type": "Organization",
        "@id": "https://onlyjobs.app/#organization",
        name: "OnlyJobs",
      },
      sameAs: ["https://www.linkedin.com/in/anoop-1507"],
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
          name: "About",
          item: "https://onlyjobs.app/about",
        },
      ],
    },
  ],
};

export default function AboutPage() {
  return (
    <>
      <SEO
        title={PAGE_TITLE}
        description="OnlyJobs is a one-person AI job matcher built by a laid-off engineer who was tired of spray-and-pray. No subscription - you pay only on days it finds you a match."
        canonical="/about"
        ogType="article"
        ogTitle="The laid-off engineer who built OnlyJobs"
        ogDescription="I built OnlyJobs after my own job hunt went badly - a matcher that explains every match, with no subscription. Here's the story, and why I don't sell one."
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
              About
            </Text>
          </HStack>
        </Box>

        <VStack align="start" spacing={8} w="full">
          <Heading as="h1" size="xl">
            Why I built OnlyJobs
          </Heading>

          <Text>
            I built OnlyJobs because I got laid off, and the job hunt that followed was miserable in
            a way I could actually fix.
          </Text>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={4}>
              The short version
            </Heading>
            <VStack align="start" spacing={4} w="full">
              <Text>
                A few years ago I was let go - &ldquo;we&apos;re sorry, Anoop, that it&apos;s come
                to this.&rdquo; It was the middle of the layoff wave, and suddenly I was competing
                with ex-Meta, ex-Google, ex-Amazon engineers for the same remote roles. Two months
                in with nothing to show, I looked in the mirror at a pair of red eyes and wondered
                whether I should even stay in software - after 12+ years and a startup I&apos;d
                built and exited.
              </Text>
              <Text>
                Then I stopped feeling sorry for myself. I was applying to more than ten jobs a day,
                juggling a dozen tabs across job boards, rephrasing the same answers over and over.
                And the real time-sink wasn&apos;t applying - it was reading. Reading long
                descriptions to work out whether a job actually fit my skills, my situation, my
                life. I&apos;m based in India, and half the time the answer was buried near the
                bottom: &ldquo;EU or US time zones only.&rdquo; There went another eight minutes
                and a bit of hope.
              </Text>
              <Text>
                So I did what an engineer does. I wrote a script that scraped the boards I used
                every morning and gave me one list. That got me volume, not judgment - I still had
                to decide what mattered. So I added an AI layer that scored each job against me and
                labelled it, strongest matches on top. A scraper at 1am, a matcher at 3am, a fresh
                set of matches by breakfast.
              </Text>
              <Text>
                The matches got good. They got <em>really</em> good when I realised my resume
                didn&apos;t capture the nuance a human reads between the lines - so I fed the AI
                the 50+ real questions and answers I&apos;d been keeping about my own work. That
                context is what made the difference.
              </Text>
              <Text>
                I found a job through it. The people interviewing me were surprised at how well it
                had matched us, and wanted to see the reasoning the AI had written for why I was a
                good fit. I called it OnlyJobs - jobs, no fluff - and it turned out I could only
                get onlyjobs.app anyway.
              </Text>
            </VStack>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={4}>
              Why there&apos;s no subscription
            </Heading>
            <VStack align="start" spacing={4} w="full">
              <Text>This is the part I feel strongest about.</Text>
              <Text>
                Why would anyone sell a monthly subscription to people who are desperate to find a
                job? That model quietly bets on you <em>staying</em> unemployed - the longer your
                search drags on, the more months you pay. It felt wrong when I was the one out of
                work. It still feels wrong.
              </Text>
              <Text>
                So OnlyJobs isn&apos;t a subscription. It&apos;s a prepaid wallet. On any day it
                finds you a match that clears your bar, it charges a flat $0.30 - whether that
                &apos;s one match or a hundred. On days it finds nothing, you pay nothing. You start
                with $2 of free credit (about six match days, no card needed), and if you land a
                job you can switch matching off and keep your balance for whenever you need it
                again. The goal is to get you <em>out</em> of the job hunt as fast as possible,
                not to keep you in it.
              </Text>
            </VStack>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={4}>
              What it is now
            </Heading>
            <Text>
              OnlyJobs sends a short daily list of jobs that actually fit you, each with a match
              score, why it fits, and what didn&apos;t - not just a keyword hit. It never applies
              for you; you review every match. It&apos;s mainly remote roles, plus some hybrid, and
              it&apos;s not just for engineers - it pulls from finance, marketing, sales, operations,
              admin, and plenty in between.
            </Text>
            <Text mt={4}>
              It&apos;s still in beta, and honestly still minimal. I&apos;d rather find out whether
              it&apos;s genuinely useful for other people and keep tuning it than slap a
              &ldquo;launched&rdquo; sticker on it. There&apos;s a long list of things I want to
              add.
            </Text>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={4}>
              Who&apos;s behind it
            </Heading>
            <VStack align="start" spacing={4} w="full">
              <Text>
                It&apos;s me - Anoop Santhanam, a full-stack engineer of 15+ years and a former
                founder - running this mostly on my own, a few hours every day making the matching
                and the sources better. OnlyJobs is operated by{" "}
                <strong>Aurora Designs LLP</strong>, based in Bangalore, India, and built for job
                seekers in the US. I&apos;m not a faceless company; I&apos;m one person who needed
                this to exist and figured others might too.
              </Text>
              <Text>
                If you&apos;re job hunting - or you coach people who are - I&apos;d genuinely love
                your feedback, good or bad. You have full control to delete your data any time.
              </Text>
              <VStack align="start" spacing={2} w="full">
                <Text>
                  Connect on LinkedIn:{" "}
                  <a
                    href="https://www.linkedin.com/in/anoop-1507"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    linkedin.com/in/anoop-1507
                  </a>
                </Text>
                <Text>
                  Questions:{" "}
                  <a href="mailto:contact@auroradesignshq.com">
                    contact@auroradesignshq.com
                  </a>
                </Text>
              </VStack>
            </VStack>
          </Box>

          <Divider />

          <Box w="full" textAlign="center" py={4}>
            <Heading as="h2" size="lg" mb={3}>
              Try it yourself
            </Heading>
            <Text mb={5}>
              Fewer, better matches from something that actually gets you. No subscription: pay only
              on days a match clears your bar, and you control it.
            </Text>
            <VStack spacing={3} align="center">
              <Button as="a" href="/sample-match-report" colorScheme="blue" size="lg">
                See a sample match report &rarr;
              </Button>
              <Button
                as="a"
                href="/?utm_source=site&utm_medium=about&utm_content=cta#signup"
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
