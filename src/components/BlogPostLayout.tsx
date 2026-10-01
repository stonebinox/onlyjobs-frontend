import Link from "next/link";
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { SEO } from "@/components/SEO";
import { JsonLd } from "@/components/JsonLd";
import { Footer } from "@/components/Footer";
import { formatDate, type BlogPost } from "@/content/blog";

interface BlogPostLayoutProps {
  post: BlogPost;
  children: React.ReactNode;
}

export function BlogPostLayout({ post, children }: BlogPostLayoutProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.h1,
        description: post.description,
        datePublished: post.datePublished,
        dateModified: post.datePublished,
        inLanguage: "en-US",
        image: ["https://onlyjobs.app/og-image.png"],
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://onlyjobs.app/blog/${post.slug}`,
        },
        author: {
          "@type": "Person",
          "@id": "https://onlyjobs.app/about#person",
          name: "Anoop Santhanam",
          url: "https://onlyjobs.app/about",
        },
        publisher: {
          "@type": "Organization",
          "@id": "https://onlyjobs.app/#organization",
          name: "OnlyJobs",
        },
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
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: `https://onlyjobs.app/blog/${post.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <SEO
        title={post.title}
        description={post.description}
        canonical={`/blog/${post.slug}`}
        ogType="article"
        ogTitle={post.ogTitle}
        ogDescription={post.ogDescription}
      />
      <JsonLd data={jsonLd} />

      <Container maxW="container.md" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
        <Box as="nav" aria-label="Breadcrumb" mb={4}>
          <HStack spacing={1} fontSize="sm">
            <Link href="/">Home</Link>
            <Text as="span" color="gray.400" px={1}>
              &rsaquo;
            </Text>
            <Link href="/blog">Blog</Link>
            <Text as="span" color="gray.400" px={1}>
              &rsaquo;
            </Text>
            <Text as="span" color="gray.700">
              {post.h1}
            </Text>
          </HStack>
        </Box>

        <Box as="main">
          <Box as="article">
            <Heading as="h1" size="xl" mb={2}>
              {post.h1}
            </Heading>

            <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time>

            <VStack align="start" spacing={5} mt={6} w="full">
              {children}
            </VStack>

            <Box mt={8} pt={6} borderTopWidth={1} textAlign="center">
              <VStack spacing={3} align="center">
                <Button as="a" href="/sample-match-report" colorScheme="blue" size="lg">
                  See a sample match report &rarr;
                </Button>
                <Button
                  as="a"
                  href={`/?utm_source=site&utm_medium=blog&utm_content=${post.slug}#signup`}
                  colorScheme="green"
                  size="lg"
                >
                  Get my first matches, $2 free &rarr;
                </Button>
              </VStack>
            </Box>
          </Box>
        </Box>
      </Container>

      <Footer />
    </>
  );
}
