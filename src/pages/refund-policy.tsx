import { Box, Heading } from "@chakra-ui/react";
import { SEO } from "@/components/SEO";

const RefundPolicy = () => {
  return (
    <>
      <SEO
        title="Refund Policy"
        description="Learn about OnlyJobs refund and cancellation policies. Understand how wallet funds, billing, and refund requests are handled."
        canonical="/refund-policy"
      />
      <Box p={8}>
      <Heading size="lg">Refund & Cancellation Policy (OnlyJobs)</Heading>
      <strong>Last updated: 25 Dec 2025</strong>
      <ul>
        <li>
          <strong>Digital services:</strong> Because matching and AI usage are
          delivered instantly, charges are generally non-refundable once
          consumed.
        </li>
        <li>
          <strong>Mistakes & failures:</strong> If a technical error on our side
          causes a charge without delivering service, we’ll credit your wallet
          or refund on request.
        </li>
        <li>
          <strong>Wallet funds:</strong> Wallet funds (in USD) do not expire.
          Funds are non-withdrawable by default, but if you contact us, we may
          consider refund requests on a case-by-case basis. If you permanently
          close your account within 14 days of a top-up and haven&apos;t used
          the funds, you can request a refund to the original payment method
          (processing fees may be deducted).
        </li>
      </ul>
      <p>
        If you believe you are eligible for a refund, you can request a refund
        to the original payment method (processing fees may be deducted).{" "}
        <strong>How to request:</strong> Email contact@auroradesignshq.com with
        your registered email, transaction ID, and details.
      </p>
      <br />
      <hr />
      <br />
      <Heading size="md">Cookie Notice (OnlyJobs)</Heading>
      <p>We use:</p>
      <ul>
        <li>Essential cookies (login, security, preferences) – required.</li>
        <li>
          Analytics cookies – help us improve; used only with consent. You can
          change cookie preferences in Settings → Privacy or your browser.
        </li>
      </ul>
      </Box>
    </>
  );
};

export default RefundPolicy;
