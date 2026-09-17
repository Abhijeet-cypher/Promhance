import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms and conditions for using Promhance, a free AI-powered prompt enhancement tool.",
  alternates: {
    canonical: "https://www.promhance.com/terms",
  },
};

const LAST_UPDATED = "September 17, 2026";

export default function TermsOfServicePage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden bg-[#0a0a0a] text-[#f5f5f5] pt-28">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 sm:px-10 flex-grow pb-20">
        <header className="mb-10">
          <span className="inline-block text-xs font-semibold tracking-[0.18em] uppercase text-blue-400 mb-3">
            Legal
          </span>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-sm text-[#525252]">Last Updated: {LAST_UPDATED}</p>
        </header>

        <article className="prose prose-invert max-w-none prose-headings:text-white prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-[#a1a1a1] prose-li:text-[#a1a1a1] prose-strong:text-white prose-a:text-blue-400 prose-hr:border-[#2a2a2a] prose-blockquote:border-l-blue-500/40 prose-blockquote:text-[#a1a1a1]">
          <p>
            Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully
            before using Promhance (&ldquo;Promhance,&rdquo; &ldquo;we,&rdquo;
            &ldquo;us,&rdquo; or &ldquo;our&rdquo;), accessible via our website
            (the &ldquo;Service&rdquo;). By accessing or using the Service, you
            agree to be bound by these Terms. If you do not agree, please do not
            use the Service.
          </p>

          <h2>1. Overview of the Service</h2>
          <p>
            Promhance is an AI-powered prompt enhancement tool that helps users
            improve the quality and effectiveness of their prompts for use with AI
            language models.
          </p>
          <p>
            The Service is currently offered entirely free of charge, with no paid
            plans or usage limits. We reserve the right to introduce paid
            subscription plans, usage limits, or other tiers in the future. If we
            do, we will update these Terms accordingly and provide reasonable
            notice before any such changes take effect.
          </p>

          <h2>2. Eligibility</h2>
          <p>
            The Service is intended for users who are at least 13 years old (or
            the minimum age required in your jurisdiction). By using the Service,
            you represent that you meet this age requirement and have the legal
            capacity to agree to these Terms, or, where applicable, that a parent
            or legal guardian has reviewed and consented to these Terms on your
            behalf.
          </p>

          <h2>3. Accounts</h2>
          <ul>
            <li>
              You may need to create an account to access certain features. You
              agree to provide accurate, current, and complete information when
              creating your account.
            </li>
            <li>
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activity under your account.
            </li>
            <li>
              You must notify us immediately of any unauthorized use of your
              account.
            </li>
            <li>
              We reserve the right to suspend or terminate accounts that violate
              these Terms.
            </li>
          </ul>

          <h2>4. Pricing and Future Plans</h2>
          <ul>
            <li>
              The Service is currently free to use, with no paid plans or usage
              limits in place.
            </li>
            <li>
              We reserve the right to introduce paid subscription plans, usage
              limits, or other tiers in the future.
            </li>
            <li>
              If and when such plans are introduced, we will update these Terms and
              provide reasonable advance notice, including details on pricing,
              billing, and any applicable limits for existing users.
            </li>
          </ul>

          <h2>5. Your Content and Prompts</h2>
          <ul>
            <li>
              <strong>Ownership</strong>: You retain all ownership rights to the
              prompts and content you submit to Promhance (&ldquo;User
              Content&rdquo;).
            </li>
            <li>
              <strong>License to Us</strong>: By submitting User Content, you grant
              us a limited, non-exclusive license to process, store, and transmit
              that content solely for the purpose of operating and providing the
              Service to you (e.g., generating enhanced prompt outputs and
              maintaining your account history).
            </li>
            <li>
              <strong>No Training on Your Data</strong>: We do not use your prompts
              or User Content to train any AI models that Promhance owns or
              operates. Prompts may be sent to third-party AI providers solely to
              generate your enhanced output, and those providers are restricted
              from using your prompts beyond fulfilling the request where our
              agreements with them provide for it.
            </li>
            <li>
              <strong>No Sale of Your Data</strong>: We do not sell your prompts,
              User Content, or personal data to third parties.
            </li>
            <li>
              You are responsible for ensuring you have the necessary rights to
              submit any content through the Service, and that it does not violate
              any law or third-party right. Please do not submit sensitive
              personal information in your prompts.
            </li>
          </ul>

          <h2>6. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul>
            <li>
              Submit content that is illegal, harmful, abusive, defamatory,
              infringing, or that violates the rights of others.
            </li>
            <li>
              Attempt to reverse-engineer, decompile, or extract the underlying
              methodology, models, or source code of the Service.
            </li>
            <li>
              Interfere with or disrupt the integrity or performance of the
              Service, including introducing malware or attempting unauthorized
              access.
            </li>
            <li>
              Use automated means (bots, scrapers) to access the Service without
              our prior written consent.
            </li>
            <li>Resell, sublicense, or redistribute the Service without authorization.</li>
            <li>
              Use the Service to generate content that violates applicable laws or
              third-party AI provider usage policies.
            </li>
          </ul>
          <p>
            We reserve the right to suspend or terminate access for users who
            violate this section.
          </p>

          <h2>7. Intellectual Property</h2>
          <ul>
            <li>
              The Service, including its design, features, branding, and underlying
              technology, is the property of Promhance and its licensors, protected
              by intellectual property laws.
            </li>
            <li>
              These Terms do not grant you any rights to our trademarks, logos, or
              brand assets without prior written permission.
            </li>
            <li>
              Feedback or suggestions you provide about the Service may be used by
              us without restriction or obligation to compensate you.
            </li>
          </ul>

          <h2>8. Third-Party AI Providers</h2>
          <p>
            Promhance may rely on third-party AI/LLM providers to process and
            enhance prompts. While we select providers with reasonable data
            protection standards, we are not responsible for the independent
            practices or availability of these third-party services.
          </p>

          <h2>9. Disclaimers</h2>
          <ul>
            <li>
              The Service is provided &ldquo;AS IS&rdquo; and &ldquo;AS
              AVAILABLE,&rdquo; without warranties of any kind, express or
              implied, including but not limited to merchantability, fitness for a
              particular purpose, and non-infringement.
            </li>
            <li>
              We do not guarantee that the Service will be uninterrupted or
              error-free, or that enhanced prompts will meet your specific
              expectations or produce any particular outcome when used with
              third-party AI tools.
            </li>
            <li>
              You use the Service and any outputs generated at your own risk and
              discretion.
            </li>
          </ul>

          <h2>10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Promhance and its officers,
            employees, and partners shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages, or any loss
            of profits, data, or goodwill, arising from your use of or inability to
            use the Service, even if advised of the possibility of such damages.
            Our total liability for any claim arising from these Terms or the
            Service shall not exceed the amount you paid us (if any) in the twelve
            (12) months preceding the claim. Because the Service is currently free,
            this amount is zero.
          </p>

          <h2>11. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Promhance from any claims,
            damages, losses, liabilities, and expenses (including legal fees)
            arising from your use of the Service, violation of these Terms, or
            infringement of any third-party rights.
          </p>

          <h2>12. Termination</h2>
          <ul>
            <li>
              You may stop using the Service at any time. To delete your account
              and associated data, contact us at{" "}
              <a href="mailto:admin@promhance.com">admin@promhance.com</a>.
            </li>
            <li>
              We may suspend or terminate your access to the Service, with or
              without notice, if you violate these Terms or engage in conduct we
              deem harmful to the Service or other users.
            </li>
            <li>
              Upon termination, provisions relating to intellectual property,
              disclaimers, limitation of liability, and indemnification shall
              survive.
            </li>
          </ul>

          <h2>13. Changes to the Service and Terms</h2>
          <ul>
            <li>
              We may modify, suspend, or discontinue any part of the Service at any
              time.
            </li>
            <li>
              We may update these Terms periodically. Material changes will be
              communicated via the website or email, and continued use of the
              Service after such changes constitutes acceptance of the revised
              Terms.
            </li>
          </ul>

          <h2>14. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the
            laws of India, without regard to conflict of law principles. Any
            disputes arising from these Terms or the Service shall be subject to
            the exclusive jurisdiction of the courts located in India.
          </p>

          <h2>15. Miscellaneous</h2>
          <ul>
            <li>
              <strong>Entire Agreement</strong>: These Terms, together with our{" "}
              <Link href="/privacy">Privacy Policy</Link>, constitute the entire
              agreement between you and Promhance regarding the Service.
            </li>
            <li>
              <strong>Severability</strong>: If any provision of these Terms is
              found unenforceable, the remaining provisions will remain in full
              effect.
            </li>
            <li>
              <strong>No Waiver</strong>: Our failure to enforce any right or
              provision of these Terms shall not be considered a waiver of those
              rights.
            </li>
            <li>
              <strong>Assignment</strong>: You may not assign your rights under
              these Terms without our consent. We may assign our rights and
              obligations without restriction.
            </li>
          </ul>

          <h2>16. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at:</p>
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
            See also our <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </article>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Terms of Service",
            url: "https://www.promhance.com/terms",
            description:
              "The terms and conditions for using Promhance, a free AI-powered prompt enhancement tool.",
            dateModified: "2026-09-17",
          }),
        }}
      />

      <Footer />
    </main>
  );
}
