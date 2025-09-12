import { Box, Heading } from "@chakra-ui/react";

const TermsConditions = () => {
  return (
    <Box p={8}>
      <Heading size="lg">Terms & Conditions (OnlyJobs)</Heading>{" "}
      <strong>Last updated: 13 Sept 2025</strong>
      <p>
        These Terms govern your use of OnlyJobs (“Service”). By creating an
        account or using the Service, you agree to them.
        <ol>
          <li>
            <strong>Who we are:</strong> OnlyJobs is operated by Aurora Designs
            LLP, registered at Chandra Layout, Nagarabhavi Road, Bangalore
            560072, Karnataka, India. Contact: contact@auroradesignshq.com
          </li>
          <li>
            <strong>What we do (and don’t do):</strong> OnlyJobs matches you to
            job listings, explains the match, and helps you draft application
            answers. We don’t guarantee interviews, offers, or outcomes. We
            don’t apply on your behalf unless you explicitly instruct a
            supported integration to do so.
          </li>
          <li>
            <strong>Accounts:</strong> Provide accurate info and keep your
            credentials secure. You’re responsible for activity under your
            account.
          </li>
          <li>
            <strong>Plans, wallet & payments:</strong>
            <ul>
              <li>
                You may add funds to a wallet and/or purchase usage-based
                features.
              </li>
              <li>
                Payments are processed by Razorpay; we don’t store your
                card/bank details.
              </li>
              <li>Pricing: shown in-app and may change prospectively.</li>
              <li>Taxes: where applicable, are added at checkout.</li>
            </ul>
          </li>
          <li>
            <strong>Refunds & cancellations:</strong> We provide a
            fair-use/quality policy—see Refund & Cancellation Policy. Wallet
            funds are generally non-withdrawable, but we’ll review erroneous or
            unused charges.
          </li>
          <li>
            <strong>Acceptable use:</strong> You agree not to:
            <ul>
              <li>Misrepresent your identity or credentials.</li>
              <li>
                Attempt to scrape/harvest the Service or circumvent rate limits.
              </li>
              <li>
                Upload unlawful or malicious content, or violate third-party
                rights.
              </li>
              <li>
                Use the Service to generate deceptive application materials at
                scale (spam). We may suspend/terminate accounts that violate
                this section.
              </li>
            </ul>
          </li>
          <li>
            <strong>Your content & license:</strong> You retain rights in your
            profile, resume, and prompts. You grant us a worldwide,
            non-exclusive license to use that content to operate and improve the
            Service. We may use aggregated/anonymous data for analytics and
            product improvement.
          </li>
          <li>
            <strong>Intellectual property:</strong> OnlyJobs, our models,
            ranking logic, and software are our IP. You may not reverse engineer
            or create derivative works without permission.
          </li>
          <li>
            <strong>Disclaimers:</strong> The Service is provided “as is.” We
            don’t warrant uninterrupted or error-free operation or the
            accuracy/completeness of any job listing.
          </li>
          <li>
            <strong>Limitation of liability:</strong> To the maximum extent
            permitted by law, we’re not liable for indirect or consequential
            damages. Our total liability for any claim is limited to the amount
            you paid to us in the 3 months preceding the claim.
          </li>
          <li>
            <strong>Termination:</strong> You may close your account anytime. We
            may suspend or terminate for breach, abuse, or legal risk. On
            termination, your right to use the Service ends; relevant provisions
            survive (IP, disclaimers, liability, governing law).
          </li>
          <li>
            <strong>Governing law & disputes:</strong> These Terms are governed
            by the laws of India and courts in Bengaluru, Karnataka (unless your
            local consumer law requires otherwise).
          </li>
          <li>
            <strong>Changes:</strong> We may update these Terms; we’ll notify
            you for material changes. Continued use means acceptance.
          </li>
        </ol>
      </p>
    </Box>
  );
};

export default TermsConditions;
