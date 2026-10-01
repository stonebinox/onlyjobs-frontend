import Link from "next/link";
import { Heading, Text } from "@chakra-ui/react";
import { BlogPostLayout } from "@/components/BlogPostLayout";
import { getPost } from "@/content/blog";

const post = getPost("applied-to-hundreds-of-jobs");

export default function AppliedToHundredsPage() {
  return (
    <BlogPostLayout post={post}>
      <Text>
        When I got laid off, I did what everyone says to do: I applied everywhere.
        Ten-plus jobs a day, every day, across a dozen tabs. Two months in, I had
        almost nothing to show for it - and I was competing with people from far
        bigger-name companies than mine for the same remote roles.
      </Text>

      <Text>
        Spraying applications wasn&apos;t working. So I flipped it: far fewer
        applications, far more care on the ones I sent. Here&apos;s the 60-second
        filter I started running on every listing before I&apos;d spend real time
        on it.
      </Text>

      <Heading as="h2" size="md">
        1. Is the listing real and current?
      </Heading>
      <Text>
        A vague title plus a vague company (&ldquo;fast-growing client&rdquo;,
        &ldquo;confidential&rdquo;) - skip. No salary range anywhere - a yellow
        flag. The same posting reposted for months - often a ghost listing. You can
        lose hours on jobs that were never really open.
      </Text>

      <Heading as="h2" size="md">
        2. Would I get past a 10-second human skim?
      </Heading>
      <Text>
        Read the first five requirements, not all twenty. If you can&apos;t point
        to a concrete example for at least three, it&apos;s a stretch - save it for
        later or skip it. Nice-to-haves don&apos;t count against you; must-haves do.
      </Text>

      <Heading as="h2" size="md">
        3. Does it fit the life I actually want?
      </Heading>
      <Text>
        Location, time zone, schedule, pay floor. Decide these before you start
        reading, not while a shiny listing talks you out of them. Half the
        &ldquo;perfect&rdquo; remote jobs I found had &ldquo;US time zones
        only&rdquo; buried near the bottom.
      </Text>

      <Heading as="h2" size="md">
        4. What would I actually hate about this job?
      </Heading>
      <Text>
        This is the one I&apos;d skipped for months, and it&apos;s the most useful.
        Be honest: the metric that&apos;s really &ldquo;how fast can you close
        tickets,&rdquo; the &ldquo;fast-paced&rdquo; team that means no evenings,
        the role that&apos;s 80% the thing you burned out on. If the honest answer
        is &ldquo;a lot,&rdquo; skip it - no matter how well the keywords match.
        It&apos;s the single best filter I have.
      </Text>

      <Heading as="h2" size="md">
        5. Can I write a specific &ldquo;why me&rdquo; in two sentences?
      </Heading>
      <Text>
        If you can&apos;t, the hiring manager won&apos;t see it either. If you can,
        that&apos;s your cover note.
      </Text>

      <Heading as="h2" size="md">
        6. Rank, don&apos;t hoard.
      </Heading>
      <Text>
        At the end of the day, keep your top three and apply properly. Delete the
        rest - don&apos;t &ldquo;save for later.&rdquo;
      </Text>

      <Heading as="h2" size="md">
        What changed for me
      </Heading>
      <Text>
        Applying to fewer, better-fit jobs got me further than the spray-and-pray
        ever did. The only painful part was doing this filter by hand on every
        listing - it&apos;s slow.
      </Text>

      <Text>
        Doing it by hand on every listing is the slow part - which is why I built{" "}
        <Link href="/">OnlyJobs</Link>. Once a day it scores new jobs against your
        whole profile (your resume and the things you tell it about your work) and
        sends you only the ones above your bar, each with why it fits and what
        didn&apos;t. It never applies for you - you review every match and decide.
        No subscription; a flat $0.30 only on days a match clears your bar, whether
        that&apos;s one match or a hundred, and you start with $2 free.
      </Text>

      <Text>
        <Link href="/sample-match-report">
          <strong>See a sample match report &rarr;</strong>
        </Link>{" "}
        - what the explained matches actually look like.
      </Text>
    </BlogPostLayout>
  );
}
