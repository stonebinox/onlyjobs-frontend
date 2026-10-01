import Link from "next/link";
import { Heading, Text } from "@chakra-ui/react";
import { BlogPostLayout } from "@/components/BlogPostLayout";
import { getPost } from "@/content/blog";

const post = getPost("job-search-burnout");

export default function JobSearchBurnoutPage() {
  return (
    <BlogPostLayout post={post}>
      <Text>
        Nobody warns you how heavy a job search gets. For me it was two months of
        applying every day and hearing almost nothing back - and one morning looking
        in the mirror at a pair of red eyes, genuinely wondering if I should even
        stay in my field. If you&apos;re there right now: it&apos;s not you. The
        process is brutal, and doing more of it rarely helps.
      </Text>

      <Text>Here&apos;s what actually helped me.</Text>

      <Heading as="h2" size="md">
        Cap the applications, on purpose
      </Heading>
      <Text>
        I set a hard daily limit - a handful of genuinely-good-fit jobs, applied to
        properly, then done for the day. Not &ldquo;apply to 50 and hope.&rdquo; A
        cap sounds counterintuitive when you&apos;re scared, but volume was the
        thing burning me out and it wasn&apos;t getting replies anyway.
      </Text>

      <Heading as="h2" size="md">
        Put a quality bar in front of yourself
      </Heading>
      <Text>
        Before applying to anything, I&apos;d ask one question I&apos;d skipped for
        months: &ldquo;what would I actually hate about this job?&rdquo; If the
        honest answer was &ldquo;a lot,&rdquo; I didn&apos;t apply - no matter how
        well the keywords matched. It saved me from jobs I&apos;d have quit in six
        months, and it saved me the emotional cost of chasing them.
      </Text>

      <Heading as="h2" size="md">
        Protect the hours you&apos;re not searching
      </Heading>
      <Text>
        Searching expands to fill every waking hour if you let it. I boxed it:
        specific hours for the hunt, and the rest actually off. The search went
        better when I wasn&apos;t doing it 14 hours a day.
      </Text>

      <Heading as="h2" size="md">
        Let the tedious part be someone else&apos;s job
      </Heading>
      <Text>
        The most draining part was reading endless descriptions to figure out if a
        job even fit. That&apos;s the part I eventually automated - it&apos;s why I
        built <Link href="/">OnlyJobs</Link>. Once a day it checks new jobs against
        your profile and sends you a short list of matches above your bar, each with
        why it fits and what didn&apos;t, so you&apos;re not the one grinding
        through listings. It never applies for you; you decide what to apply to. No
        subscription - a flat $0.30 only on days a match clears your bar, $2 free
        to start. And if you need to step back, you turn matching off and keep your
        balance.
      </Text>

      <Text>
        Fewer, better applications. A bar you actually hold. Hours that are yours.
        That&apos;s what pulled me out.
      </Text>

      <Text>
        <Link href="/sample-match-report">
          <strong>See a sample match report &rarr;</strong>
        </Link>
      </Text>
    </BlogPostLayout>
  );
}
