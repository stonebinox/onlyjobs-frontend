import Link from "next/link";
import {
  Box,
  Container,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { SEO } from "@/components/SEO";
import { JsonLd } from "@/components/JsonLd";
import { Footer } from "@/components/Footer";
import { POSTS, formatDate } from "@/content/blog";

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "https://onlyjobs.app/blog#webpage",
      url: "https://onlyjobs.app/blog",
      name: "The OnlyJobs Blog: Job-Hunting Without the Grind | OnlyJobs",
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
          name: "Blog",
          item: "https://onlyjobs.app/blog",
        },
      ],
    },
  ],
};

export default function BlogIndexPage() {
  return (
    <>
      <SEO
        title="The OnlyJobs Blog: Job-Hunting Without the Grind | OnlyJobs"
        description="Honest notes on job-hunting without the spray-and-pray grind, from the founder of OnlyJobs."
        canonical="/blog"
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
              Blog
            </Text>
          </HStack>
        </Box>

        <Heading as="h1" size="xl" mb={8}>
          Blog
        </Heading>

        <VStack align="start" spacing={8} w="full">
          {POSTS.map((post) => (
            <Box key={post.slug} w="full">
              <Heading as="h2" size="md" mb={2}>
                <Link href={`/blog/${post.slug}`}>{post.h1}</Link>
              </Heading>
              <Text color="gray.600" mb={1}>
                {post.excerpt}
              </Text>
              <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time>
            </Box>
          ))}
        </VStack>
      </Container>

      <Footer />
    </>
  );
}
