import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Promhance collects, uses, stores, and protects your information and prompts when you use our AI prompt enhancement service.",
  alternates: {
    canonical: "https://www.promhance.com/privacy",
  },
};

const LAST_UPDATED = "September 17, 2026";

export default function PrivacyPolicyPage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden bg-[#0a0a0a] text-[#f5f5f5] pt-28">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 sm:px-10 flex-grow pb-20">
        <header className="mb-10">
          <span className="inline-block text-xs font-semibold tracking-[0.18em] uppercase text-blue-400 mb-3">
            Legal
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#525252]">Last Updated: {LAST_UPDATED}</p>
        </header>

        <article className="prose prose-invert max-w-none prose-headings:text-white prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2 prose-p:text-[#a1a1a1] prose-li:text-[#a1a1a1] prose-strong:text-white prose-a:text-blue-400 prose-hr:border-[#2a2a2a] prose-blockquote:border-l-blue-500/40 prose-blockquote:text-[#a1a1a1]">
          <p>
            Welcome to Promhance (&ldquo;Promhance,&rdquo; &ldquo;we,&rdquo;
            &ldquo;us,&rdquo; or &ldquo;our&rdquo;). This Privacy Policy explains
            how we collect, use, store, and protect your information when you use
            our website and prompt enhancement services (the &ldquo;Service&rdquo;).
          </p>
          <p>
            By using Promhance, you agree to the collection and use of information
            in accordance with this policy.
          </p>

          <h2>1. Information We Collect</h2>

          <h3>1.1 Information You Provide</h3>
          <ul>
            <li>
              <strong>Account Information</strong>: When you create an account we
              collect your email address and password. Passwords are hashed and
              managed by our authentication provider — we never store them in
              plain text. If you sign in through a third-party provider in the
              future (for example, Google), we may receive basic profile
              information such as your name and email from that provider.
            </li>
            <li>
              <strong>Prompts</strong>: The text prompts you submit to be enhanced.
            </li>
            <li>
              <strong>Communications</strong>: Information you provide when you
              contact us for support or feedback.
            </li>
          </ul>
          <blockquote>
            <p>
              <strong>Note</strong>: Promhance is currently offered entirely free
              of charge. We do not currently collect payment information. In the
              future, we may introduce paid plans and usage limits, at which point
              this Privacy Policy will be updated to reflect how any payment
              information is collected and processed.
            </p>
          </blockquote>

          <h3>1.2 Information Collected Automatically</h3>
          <ul>
            <li>
              <strong>Device Identifier (anonymous)</strong>: Before you create an
              account, we assign your browser a random, pseudonymous identifier
              that is stored in your browser&apos;s local storage. This lets you
              view and reuse your prompt history on that device without signing
              in. You can remove it at any time by clearing your browser storage,
              which will also clear the anonymous history tied to it.
            </li>
            <li>
              <strong>Usage Data</strong>: Pages visited, features used, time
              spent on the Service, and interaction patterns.
            </li>
            <li>
              <strong>Device and Log Data</strong>: IP address, browser type,
              operating system, device identifiers, and access timestamps.
            </li>
            <li>
              <strong>Cookies and Similar Technologies</strong>: We use cookies and
              similar technologies to maintain sessions, remember preferences, and
              analyze usage (for example, through Google Analytics). You can
              control cookies through your browser settings.
            </li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, operate, and maintain the Service, including enhancing your prompts.</li>
            <li>Create and manage your account.</li>
            <li>Improve, personalize, and expand the Service.</li>
            <li>Communicate with you, including customer support, updates, and marketing (with opt-out options).</li>
            <li>Monitor and analyze usage trends to improve performance and user experience.</li>
            <li>Detect, prevent, and address technical issues, fraud, or abuse.</li>
            <li>Comply with legal obligations.</li>
          </ul>

          <h2>3. How We Use Your Prompts</h2>
          <p>
            Your prompts are central to how our Service works, and we treat them
            with care:
          </p>
          <ul>
            <li>
              <strong>We do NOT sell your prompts</strong> to any third party,
              under any circumstances.
            </li>
            <li>
              <strong>We do NOT use your prompts to train</strong> any AI models
              that Promhance owns or operates.
            </li>
            <li>
              Prompts are processed solely to deliver the enhancement feature you
              requested and, where applicable, to maintain your prompt history
              within your account for your own reference.
            </li>
            <li>
              Prompts may be transmitted to third-party AI providers (such as
              Google Gemini) strictly to generate the enhanced output. Those
              providers process the data under their own data handling terms, and
              where our agreements with them provide for it, they are restricted
              from using your prompts beyond fulfilling the request. We recommend
              not including sensitive personal information in your prompts.
            </li>
          </ul>

          <h2>4. Data Sharing and Disclosure</h2>
          <p>
            We do not sell your personal data or your prompts. We may share
            information only in the following circumstances:
          </p>
          <ul>
            <li>
              <strong>Service Providers</strong>: With trusted third-party vendors
              who help us operate the Service (e.g., hosting providers, analytics
              tools, and underlying AI/LLM providers), under confidentiality
              obligations.
            </li>
            <li>
              <strong>Legal Requirements</strong>: If required by law, regulation,
              legal process, or governmental request.
            </li>
            <li>
              <strong>Business Transfers</strong>: In connection with a merger,
              acquisition, or sale of assets, where user information may be
              transferred as part of that transaction, subject to standard
              confidentiality protections.
            </li>
            <li>
              <strong>With Your Consent</strong>: In any other case where you have
              given explicit permission.
            </li>
          </ul>

          <h2>5. Data Storage and Security</h2>
          <ul>
            <li>
              Your data, including account details and prompts, is stored on secure
              servers with industry-standard security measures (encryption in
              transit, access controls, etc.).
            </li>
            <li>
              While we take reasonable steps to protect your data, no method of
              transmission or storage is 100% secure, and we cannot guarantee
              absolute security.
            </li>
            <li>
              We retain your data for as long as your account is active or as
              needed to provide the Service, comply with legal obligations,
              resolve disputes, and enforce agreements.
            </li>
          </ul>

          <h2>6. Your Rights and Choices</h2>
          <p>
            Depending on your location, you may have the right to:
          </p>
          <ul>
            <li>Access the personal data we hold about you.</li>
            <li>Request correction or deletion of your data.</li>
            <li>Object to or restrict certain processing of your data.</li>
            <li>Request a copy of your data in a portable format.</li>
            <li>Withdraw consent (where processing is based on consent) at any time.</li>
            <li>Opt out of marketing communications at any time via the unsubscribe link or by contacting us.</li>
          </ul>
          <p>
            To exercise these rights, contact us at{" "}
            <a href="mailto:admin@promhance.com">admin@promhance.com</a>.
          </p>

          <h2>7. Children&apos;s Privacy</h2>
          <p>
            The Service is not directed to, and is not intended for use by,
            children under the age of 13 (or the minimum age required in your
            jurisdiction). We do not knowingly collect personal data from
            children. If you are a parent or guardian and believe your child has
            provided us with personal data, please contact us and we will take
            steps to delete it.
          </p>

          <h2>8. International Data Transfers</h2>
          <p>
            If you access the Service from outside the country where our servers
            are located, your information may be transferred internationally. We
            take steps to ensure appropriate safeguards are in place for such
            transfers, consistent with applicable law.
          </p>

          <h2>9. Third-Party Links</h2>
          <p>
            Our Service may contain links to third-party websites or services. We
            are not responsible for the privacy practices of these third parties.
            We encourage you to review their privacy policies separately.
          </p>

          <h2>10. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any material changes by posting the new policy on this page and
            updating the &ldquo;Last Updated&rdquo; date. Continued use of the
            Service after changes constitutes acceptance of the revised policy.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have any questions or concerns about this Privacy Policy or our
            data practices, please contact us at:
          </p>
          <ul>
            <li>
              <strong>Email</strong>:{" "}
              <a href="mailto:admin@promhance.com">admin@promhance.com</a>
            </li>
            <li>
              <strong>Website</strong>:{" "}
              <a href="https://www.promhance.com">https://www.promhance.com</a>
            </li>
          </ul>

          <hr />
          <p>
            See also our <Link href="/terms">Terms of Service</Link>.
          </p>
        </article>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Privacy Policy",
            url: "https://www.promhance.com/privacy",
            description:
              "How Promhance collects, uses, stores, and protects your information and prompts.",
            dateModified: "2026-09-17",
          }),
        }}
      />

      <Footer />
    </main>
  );
}
