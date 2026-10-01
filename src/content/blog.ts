export interface BlogPost {
  slug: string;
  title: string;
  h1: string;
  excerpt: string;
  datePublished: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

export const POSTS: BlogPost[] = [
  {
    slug: "applied-to-hundreds-of-jobs",
    title: "I Applied to Hundreds of Jobs and Heard Almost Nothing - Here's What I Changed | OnlyJobs",
    h1: "I applied to hundreds of jobs and heard almost nothing. Here's what I changed.",
    excerpt: "Spraying applications stopped working for me. Applying to fewer, better-fit jobs did. Here's the 60-second filter I started running on every listing.",
    datePublished: "2026-10-01",
    description: "Spraying applications stopped working for me. Here's the 60-second filter I ran on every listing - including the one question that cut the most jobs.",
    ogTitle: "The 60-second filter I used after hundreds of job applications flopped",
    ogDescription: "Fewer, better-fit applications beat spray-and-pray. The filter that turned it around - and the 'what would I hate about this job?' question that did the most.",
  },
  {
    slug: "job-search-burnout",
    title: "Job Search Burnout Is Real - I Apply to Fewer Jobs on Purpose Now | OnlyJobs",
    h1: "Job search burnout is real. I apply to fewer jobs on purpose now.",
    excerpt: "The endless-application grind burned me out. Applying to fewer jobs - on purpose, behind a quality bar - was what pulled me out of it.",
    datePublished: "2026-10-01",
    description: "The endless-application grind burned me out. Applying to fewer jobs - on purpose, behind a quality bar - is what pulled me out of it.",
    ogTitle: "I beat job-search burnout by applying to fewer jobs on purpose",
    ogDescription: "Cap the applications, hold a quality bar, protect your off-hours. What actually helped when the job-hunt grind burned me out.",
  },
];

export function getPost(slug: string): BlogPost {
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) throw new Error(`Blog post not found: ${slug}`);
  return post;
}

// Parse as UTC to avoid timezone off-by-one (e.g. "2026-10-01" → "October 1, 2026").
export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
