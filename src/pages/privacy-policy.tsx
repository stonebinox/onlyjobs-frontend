import { Box, Heading } from "@chakra-ui/react";
import Link from "next/link";
import { SEO } from "@/components/SEO";

const PrivacyPolicyPage = () => {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="Learn how OnlyJobs collects, uses, and protects your personal data. We're committed to transparency and your privacy rights."
        canonical="/privacy-policy"
      />
      <Box p={8}>
      <Heading size="lg">Privacy Policy (OnlyJobs)</Heading>
      <strong>Last updated: 25 Dec 2025</strong>
      <p>
        OnlyJobs (“we”, “us”, “our”) helps candidates discover and evaluate jobs
        with AI-assisted tools. This policy explains what we collect, why, and
        how you can control it.
      </p>
      <strong>What we collect</strong>
      <ul>
        <li>
          Account data: name, email, password (hashed), country, time zone.
        </li>
        <li>
          Profile & documents: resume/CV, links (GitHub/LinkedIn/portfolio),
          skills, work history, salary preferences, answers to application
          questions.
        </li>
        <li>
          Usage data: pages viewed, clicks, match actions, device/browser, IP,
          approximate location (from IP), cookies.
        </li>
        <li>
          Content you provide to AI features: prompts, Q&A, job-specific
          answers, chat history with the OnlyJobs AI.
        </li>
        <li>
          Job data: job descriptions we ingest to compute matches and show
          reasoning.
        </li>
        <li>
          Payments: wallet top-ups (in USD) and purchases are processed by
          Razorpay. We receive transaction IDs and status, but we do not store
          card/bank details.
        </li>
        <li>Support messages: emails, chat transcripts, attachments.</li>
      </ul>
      <strong>How we use data:</strong>
      <ul>
        <li>Match you to roles and explain the match reasons.</li>
        <li>Generate application answers you request.</li>
        <li>
          Improve ranking models and product features (aggregate/anonymous where
          possible).
        </li>
        <li>Provide support, detect abuse, secure the service.</li>
        <li>Handle billing, tax, and compliance.</li>
      </ul>
      <strong>Legal bases (where applicable)</strong>
      <ul>
        <li>Contract: to provide the service you signed up for.</li>
        <li>
          Legitimate interests: quality, security, analytics, preventing abuse.
        </li>
        <li>
          Consent: marketing emails, optional cookies, showing your name in
          testimonials, etc.
        </li>
      </ul>
      <strong>Sharing</strong>
      <ul>
        <li>
          Processors: hosting, analytics, error tracking, email, and AI
          infrastructure providers that process data on our behalf under
          contract.
        </li>
        <li>
          Payments: Razorpay processes your payment data. See their policy.
        </li>
        <li>Compliance & safety: if required by law or to prevent harm.</li>
        <li>
          Business transfers: if we merge/sell, subject to the same protections.
        </li>
      </ul>
      <strong>International transfers</strong>
      <p>
        We may store/process data outside your country. We use reputable
        providers and appropriate safeguards.
      </p>
      <strong>Retention</strong>
      <ul>
        <li>Account & profile data: while your account is active.</li>
        <li>Logs/analytics: typically 12–24 months.</li>
        <li>Payment records: as required by tax/accounting law.</li>
      </ul>
      <p>
        You can request deletion (see Your rights). Your rights Subject to law
        where you live: access, correct, delete, export, and object to/limit
        processing. Email contact@auroradesignshq.com or use in-app settings.
      </p>
      <strong>Cookies</strong>
      <p>
        We use necessary cookies and, with consent, analytics. You can control
        cookies in your browser. See our short Cookie Notice below.
      </p>
      <strong>AI features</strong>
      <p>
        Prompts and outputs you generate may be sent to AI providers to fulfill
        your request. We instruct them not to use your data to train their
        models unless they already have a separate agreement that permits it; we
        also minimize what we send.
      </p>
      <strong>Children</strong>
      <p>
        OnlyJobs is for adults (18+). We don’t knowingly collect data from
        minors.
      </p>
      <strong>Contact & Grievance Officer (India)</strong>
      <ul>
        <li>
          Email:{" "}
          <Link href="mailto:contact@auroradesignshq.com">
            contact@auroradesignshq.com
          </Link>
        </li>
        <li>Postal: Chandra Layout Post Office, Bangalore, Karnataka, India</li>
        <li>Grievance Officer (per IT Rules, 2021): Name: Anoop Santhanam</li>
        <li>
          Email:{" "}
          <Link href="mailto:contact@auroradesignshq.com">
            contact@auroradesignshq.com
          </Link>
        </li>
        <li>
          Address: Chandra Layout, Nagarabhavi Road, Bangalore 560072,
          Karnataka, India
        </li>
      </ul>
      <p>
        <strong>Changes: </strong>If we make material changes, we’ll notify you
        by email or in-app.
      </p>
      </Box>
    </>
  );
};

export default PrivacyPolicyPage;
