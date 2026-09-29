import Link from "next/link";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Divider,
  Button,
  Badge,
} from "@chakra-ui/react";
import { SEO } from "@/components/SEO";
import { JsonLd } from "@/components/JsonLd";
import { Footer } from "@/components/Footer";

interface MatchCardProps {
  matchNumber: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  score: number;
  whyItFits: string[];
  whatDidntFit: string[];
  ourTake: string;
}

function MatchCard({
  matchNumber,
  title,
  company,
  location,
  salary,
  score,
  whyItFits,
  whatDidntFit,
  ourTake,
}: MatchCardProps) {
  return (
    <Box
      as="article"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="md"
      p={{ base: 4, md: 6 }}
      mb={6}
    >
      <HStack mb={2} align="center" flexWrap="wrap" spacing={3}>
        <Badge
          colorScheme="green"
          fontSize="md"
          px={3}
          py={1}
          borderRadius="full"
        >
          {score}%
        </Badge>
        <Heading as="h3" size="md">
          Match {matchNumber}: {title}
        </Heading>
      </HStack>
      <Text color="gray.600" mb={4} fontSize="sm">
        {company} &mdash; {location} &mdash; {salary}
      </Text>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={4}>
        <Box>
          <Heading as="h4" size="sm" mb={3} color="green.700">
            Why it fits
          </Heading>
          <VStack align="start" spacing={3}>
            {whyItFits.map((item) => (
              <Text key={item.slice(0, 40)} fontSize="sm">
                {item}
              </Text>
            ))}
          </VStack>
        </Box>
        <Box>
          <Heading as="h4" size="sm" mb={3} color="orange.700">
            What didn&apos;t fit, and why it&apos;s not higher
          </Heading>
          <VStack align="start" spacing={3}>
            {whatDidntFit.map((item) => (
              <Text key={item.slice(0, 40)} fontSize="sm">
                {item}
              </Text>
            ))}
          </VStack>
        </Box>
      </SimpleGrid>
      <Box
        borderLeftWidth="3px"
        borderLeftColor="blue.300"
        pl={3}
        py={1}
        mt={2}
      >
        <Text fontSize="sm" fontStyle="italic">
          <strong>Our take:</strong> {ourTake}
        </Text>
      </Box>
    </Box>
  );
}

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://onlyjobs.app/sample-match-report#webpage",
      url: "https://onlyjobs.app/sample-match-report",
      name: "Sample AI Job Match Report: See Why Each Job Fits | OnlyJobs",
      description:
        "A sample OnlyJobs report: 3 remote and hybrid job matches, why each fits, and what didn't fit and why the score is lower. Illustrative example.",
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
          name: "Sample match report",
          item: "https://onlyjobs.app/sample-match-report",
        },
      ],
    },
  ],
};

export default function SampleMatchReportPage() {
  return (
    <>
      <SEO
        title="Sample AI Job Match Report: See Why Each Job Fits | OnlyJobs"
        description="A sample OnlyJobs report: 3 remote and hybrid job matches, why each fits, and what didn't fit and why the score is lower. Illustrative example."
        canonical="/sample-match-report"
        ogType="article"
        ogTitle="3 jobs, why each one fits, and what you might not like: a sample OnlyJobs report"
        ogDescription="Match scores explained by work stories and culture preferences, including what didn't fit. Illustrative example."
        ogImage="https://onlyjobs.app/og/sample-match-report.png"
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
              Sample match report
            </Text>
          </HStack>
        </Box>

        <VStack align="start" spacing={8} w="full">
          <Heading as="h1" size="xl">
            A sample OnlyJobs match report: 3 jobs, why each fits, and what might not
          </Heading>

          <Box
            borderWidth="1px"
            borderColor="blue.200"
            bg="blue.50"
            borderRadius="md"
            p={4}
            w="full"
          >
            <Text>
              <strong>This is an illustrative example.</strong> &ldquo;Dana&rdquo; is a made-up job
              seeker, and the companies and jobs are fictional. The kinds of reasons and the pricing
              match the product. This page spreads them into two columns so a cold visitor can scan;
              in the app, each match comes with a short 2&ndash;3 sentence reasoning.
            </Text>
          </Box>

          <Text>
            Job boards show you everything that matches a keyword, and every listing looks perfect.
            OnlyJobs shows you a few jobs a day and tells you{" "}
            <strong>why each one fits you, and what about it you might not like</strong>. That second
            part is where you can tell it actually understands you. Here is one fictional
            person&apos;s day.
          </Text>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={4}>
              Meet Dana (illustrative)
            </Heading>
            <VStack align="start" spacing={4} w="full">
              <Text>
                Customer support team lead, 7 years&apos; experience, based near Columbus, Ohio.
                Wants remote work, or hybrid in Columbus up to 2 days a week. Pay floor: $62,000.
              </Text>
              <Text>
                <strong>How OnlyJobs got to know her.</strong> Dana uploaded her resume. Then
                OnlyJobs started asking questions, open-ended ones that kept coming. She answered
                some by voice while walking the dog and typed others in a spare ten minutes, talking
                things through the way she would with a friend. Nothing forced her into checkboxes,
                and she can keep adding more whenever she likes.
              </Text>
              <Box w="full">
                <Text fontWeight="semibold" mb={2}>
                  Her work stories (the two that shaped her matches most):
                </Text>
                <VStack align="start" spacing={3} pl={4} w="full">
                  <Text>
                    <strong>The help-center rebuild.</strong> &ldquo;The same five questions kept
                    coming in, so I rewrote our help articles and in-app tips. Repeat
                    &lsquo;how do I reschedule?&rsquo; tickets dropped by about half in two
                    months.&rdquo;
                  </Text>
                  <Text>
                    <strong>The billing outage.</strong> &ldquo;When billing went down, I wrote the
                    customer update every hour and took the angry escalations myself so my team
                    could keep the queue moving.&rdquo;
                  </Text>
                </VStack>
              </Box>
              <Box w="full">
                <Text fontWeight="semibold" mb={2}>
                  Her culture preferences:
                </Text>
                <VStack align="start" spacing={1} pl={4} w="full">
                  <Text>Written-first and calm, not &ldquo;always on&rdquo; video calls or Slack</Text>
                  <Text>Measured on whether the customer&apos;s problem got solved, not just speed</Text>
                  <Text>Predictable weekday hours, with one weekend a month at most</Text>
                  <Text>A small-to-mid team where she can shape how things are done</Text>
                  <Text>
                    Deal-breakers: commission pay, &ldquo;work hard, play hard&rdquo; culture,
                    unpaid trial projects
                  </Text>
                </VStack>
              </Box>
              <Text>
                <strong>Her match-score threshold:</strong> 80%. Only jobs at 80% or above reach
                her, and only those days cost anything.
              </Text>
            </VStack>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={6}>
              Today: Dana has 3 jobs waiting for her
            </Heading>

            <MatchCard
              matchNumber={1}
              title="Support Operations Lead"
              company="Northbank Billing (fictional), a 60-person medical billing software company"
              location="Remote (US)"
              salary="$68,000&ndash;$78,000"
              score={88}
              whyItFits={[
                "Your help-center rebuild is the job. The role owns the knowledge base and macros and asks for someone who can 'cut repeat contacts.' That's exactly what you did with the reschedule tickets.",
                "Your outage story matches a stated duty. The lead writes customer updates during incidents, and you've done it hourly, under pressure.",
                "They measure what you care about: resolution rate and satisfaction, with no handle-time targets. That's the opposite of the job you left.",
                "Culture: their careers page describes an async, written-first team working Monday–Friday.",
              ]}
              whatDidntFit={[
                "You'd be on call about once a quarter for incidents. You told us you want predictable hours. It's rare, but it isn't zero, and it's the main thing holding this below 90%.",
                "Different tools. They use Zendesk and you've used Freshdesk. The skills transfer, but you'll need to say so up front.",
                "New domain. Medical billing terms will be unfamiliar, so expect a real learning curve in month one.",
              ]}
              ourTake="Strong fit. Ask how often on-call actually happens, and lead your application with the help-center story."
            />

            <MatchCard
              matchNumber={2}
              title="Customer Experience Team Lead"
              company="Scioto Schedule Co. (fictional), a 25-person scheduling app for home-service businesses"
              location="Hybrid, Columbus (2 days/week)"
              salary="$60,000&ndash;$70,000"
              score={85}
              whyItFits={[
                "You know this product category. You've supported scheduling software, so their customers' 'reschedule' problems are ones you've already solved.",
                "Your training story is the brief. You'd lead 6 agents, and they want someone to 'build our onboarding from scratch.' You already wrote one that's still in use.",
                "Small team, real influence: shaping the process is one of your stated preferences.",
                "Hybrid within your limit: 2 days a week in Columbus.",
              ]}
              whatDidntFit={[
                "Pay starts below your floor. The range opens at $60,000, under your $62,000. It overlaps, but you'd need to negotiate, and that cost points.",
                "'Fast-paced' startup. We found no weekend rotations or hustle language, but at 25 people the pace could run hotter than the calm team you described. Ask about it.",
                "Weekend coverage one weekend a month. That's right at your limit, not over it.",
                "Office days. You said remote was your first choice, and 2 days is your maximum.",
              ]}
              ourTake="Good fit if the pay lands mid-range. Raise the pace question in the first call."
            />

            <MatchCard
              matchNumber={3}
              title="Member Support Manager"
              company="Olentangy Member Services (fictional)"
              location="Remote (Ohio residents)"
              salary="$70,000&ndash;$80,000"
              score={81}
              whyItFits={[
                "Escalations are the core of the role. You'd handle member complaints front-line staff can't resolve, which is what you did in the billing outage.",
                "Your schedule: Monday–Friday, 8 to 5 Eastern, no weekends.",
                "Outcome over speed: the posting emphasizes 'member outcomes' and first-contact resolution.",
                "Best pay of the three, fully above your floor.",
              ]}
              whatDidntFit={[
                "Phone- and video-heavy. The posting mentions a daily camera-on huddle and live phone escalations. You told us you do your best work written-first, and this is the biggest reason the score is lower.",
                "More formal and layered than the small teams you prefer. There'd be less room to reshape processes.",
                "Compliance knowledge wanted. They'd like financial-services compliance experience, which you don't have yet.",
              ]}
              ourTake="Worth a look for the pay and stability, but only if the daily video huddle doesn't bother you as much as you think it will."
            />

            <Box
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              p={4}
              mt={2}
              bg="gray.50"
            >
              <Text fontWeight="semibold" mb={2}>
                What today cost Dana
              </Text>
              <VStack align="start" spacing={1}>
                <Text fontSize="sm">
                  Today: 3 matches cleared her 80% bar, so <strong>$0.30</strong> came out of her
                  wallet. That&apos;s charged once for the day, however many matches there are.
                </Text>
                <Text fontSize="sm">
                  Yesterday: her best match was 76%, so nothing was sent and she paid{" "}
                  <strong>$0</strong>.
                </Text>
                <Text fontSize="sm">
                  Each match also comes with drafted answers to common application questions.{" "}
                  <strong>OnlyJobs never applies for her.</strong> She decides.
                </Text>
              </VStack>
            </Box>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={4}>
              Jobs under your bar never reach you (illustration)
            </Heading>
            <Box borderLeftWidth="3px" borderLeftColor="gray.300" pl={4} py={1}>
              <Text mb={2}>
                <strong>Senior Support Specialist, a fintech startup (fictional) &mdash; Remote &mdash; 74% match</strong>
              </Text>
              <Text fontSize="sm" mb={3}>
                On keywords this looked close. But its main performance metric is average handle
                time, and it includes rotating weekend shifts. Both match Dana&apos;s stated
                deal-breakers: handle-time pressure is why she left her last job, and the weekend
                rotation breaks her schedule preference.
              </Text>
              <Text fontSize="sm" color="gray.600">
                It scored below Dana&apos;s 80% threshold. Below-threshold jobs are recorded as
                skipped in the system and do not appear in the app &mdash; not in Today, not
                anywhere else.
              </Text>
            </Box>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={3}>
              Why &ldquo;what didn&apos;t fit&rdquo; matters
            </Heading>
            <Text>
              Any tool can say a job is a great match. Telling you what you might dislike about it,
              and lowering the score because of it, is the proof that it understood what you said.
              It also saves you from applying to jobs you&apos;d quit in six months.
            </Text>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={4}>
              How you&apos;d get your own report
            </Heading>
            <VStack align="start" spacing={3} w="full">
              <Text>
                <strong>1. Upload your resume.</strong>
              </Text>
              <Text>
                <strong>2. Talk it through, by voice or text.</strong> OnlyJobs keeps asking
                open-ended questions: problems you&apos;ve fixed, work you loved, a job you left and
                why, how you like to be managed. Answer as much as you want, whenever you want. The
                more you share, the sharper your matches and the more honest the &ldquo;what
                didn&apos;t fit&rdquo; becomes.
              </Text>
              <Text>
                <strong>3. Set your preferences and deal-breakers:</strong> remote or hybrid,
                schedule, pace, pay floor, how you want to be measured.
              </Text>
              <Text>
                <strong>4. Once a day,</strong> OnlyJobs checks the jobs it pulled that day from
                its job sources (mostly remote, plus hybrid, tech and non-tech) and sends only the
                ones above your threshold, each with why it fits and what didn&apos;t.
              </Text>
            </VStack>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="lg" mb={4}>
              Pricing, in plain terms
            </Heading>
            <VStack align="start" spacing={2} w="full">
              <Text>
                <strong>No subscription.</strong> It&apos;s a prepaid wallet.
              </Text>
              <Text>
                <strong>$2 free to start,</strong> which is about 6 match days. No card needed.
              </Text>
              <Text>
                <strong>$0.30 only on days</strong> at least one match clears your threshold. $0
                every other day.
              </Text>
              <Text>
                <strong>You&apos;re in control:</strong> raise your threshold for fewer, stronger
                matches (and fewer charged days), or pause anytime.
              </Text>
              <Text>
                Top up $5, $10 or $20 (about 16, 33 or 66 match days), or enter a custom amount.
              </Text>
            </VStack>
          </Box>

          <Divider />

          <Box w="full">
            <VStack align="start" spacing={6} w="full">
              <Box>
                <Heading as="h2" size="md" mb={2}>
                  Is Dana a real person?
                </Heading>
                <Text>
                  No. Dana and the companies are fictional, made up to show the format. We&apos;ll
                  add a real, anonymized report once a user agrees to share one.
                </Text>
              </Box>
              <Box>
                <Heading as="h2" size="md" mb={2}>
                  What kinds of jobs does OnlyJobs cover?
                </Heading>
                <Text>
                  Mostly remote roles, plus hybrid ones. It covers tech and non-tech roles alike:
                  customer support, operations, finance, admin, sales, marketing and more.
                </Text>
              </Box>
              <Box>
                <Heading as="h2" size="md" mb={2}>
                  Where do the jobs come from?
                </Heading>
                <Text>
                  Every day OnlyJobs pulls new postings from a hand-picked set of quality remote
                  boards and checks each one against your profile. You apply on the employer&apos;s
                  or source site.
                </Text>
              </Box>
              <Box>
                <Heading as="h2" size="md" mb={2}>
                  Do I have to do a call?
                </Heading>
                <Text>
                  No. Answer by voice or by typing, whichever you prefer, and come back to add more
                  anytime.
                </Text>
              </Box>
              <Box>
                <Heading as="h2" size="md" mb={2}>
                  What if I get no matches for a few days?
                </Heading>
                <Text>
                  You pay nothing for those days. If it keeps happening, lower your threshold a
                  little or broaden your preferences.
                </Text>
              </Box>
              <Box>
                <Heading as="h2" size="md" mb={2}>
                  Will it apply to jobs for me?
                </Heading>
                <Text>
                  No. There&apos;s no auto-apply. You get the match, the reasons, what didn&apos;t
                  fit and drafted answers, and you decide.
                </Text>
              </Box>
            </VStack>
          </Box>

          <Divider />

          <Box w="full" textAlign="center" py={4}>
            <Heading as="h2" size="lg" mb={3}>
              Want to see your own 3 jobs, and what you might not like about them?
            </Heading>
            <Text mb={5}>
              Fewer, better matches from something that actually gets you. No subscription: pay only
              on days we find you jobs, and you control it.
            </Text>
            <Button
              as="a"
              href="/?utm_source=site&utm_medium=sample-report&utm_content=bottom-cta#signup"
              colorScheme="blue"
              size="lg"
              mb={3}
            >
              Get my first matches, $2 free &rarr;
            </Button>
            <Text fontSize="sm" color="gray.500">
              No card needed. About 6 match days free.
            </Text>
          </Box>

          <Divider />

          <Text fontSize="xs" color="gray.500" textAlign="center" w="full">
            Example is illustrative. Names, companies, pay ranges and job details are fictional.
            OnlyJobs is operated by Aurora Designs LLP.
          </Text>
        </VStack>
      </Container>

      <Footer />
    </>
  );
}
