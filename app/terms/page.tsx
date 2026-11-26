import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import { PLAN_LIMITS, PLANS } from "@/lib/plans";
import { isBillingPublic } from "@/lib/paypal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms and conditions for using Promhance, an AI-powered prompt enhancement tool with free and paid plans, including usage limits and our refund policy.",
  alternates: {
    canonical: "https://www.promhance.com/terms",
  },
};

const LAST_UPDATED = "November 24, 2026";

export default function TermsOfServicePage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden bg-[#0a0a0a] text-[#f5f5f5] pt-28">
      <div className="fixed inset-0 bg-grid-overlay pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 sm:px-10 flex-grow pb-20">
        <header className="mb-10">
          <span className="inline-block text-xs font-semibold tracking-[0.18em] uppercase text-blue-400 mb-3">
            Legal
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-sm text-[#525252]">Last Updated: {LAST_UPDATED}</p>
        </header>

        <article className="prose prose-invert max-w-none prose-headings:text-white prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-[#a1a1a1] prose-li:text-[#a1a1a1] prose-strong:text-white prose-a:text-blue-400 prose-hr:border-[#2a2a2a] prose-blockquote:border-l-blue-500/40 prose-blockquote:text-[#a1a1a1]">
          <p>
            Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully
            before using Promhance (&ldquo;Promhance,&rdquo; &ldquo;we,&rdquo;
            &ldquo;us,&rdquo; or &ldquo;our&rdquo;), accessible via our website
            (the &ldquo;Service&rdquo;). References to &ldquo;we,&rdquo;
            &ldquo;us,&rdquo; or &ldquo;our&rdquo; refer to Promhance as the
            party responsible for the Service. By accessing or using the Service,
            you agree to be bound by these Terms. If you do not agree, please do
            not use the Service.
          </p>

          <p>
            <strong>Your agreement is recorded.</strong> When you create an
            account, we ask you to tick a box confirming that you have read and
            agree to these Terms and our Privacy Policy. If you use the Service
            without an account, a notice next to the Enhance button tells you
            that by enhancing you agree to them, and your first use after seeing
            that notice counts as your agreement. We keep a record of the
            agreement: the version, the date and time, your IP address, your
            browser details, and your account or anonymous device identifier. If
            we update these Terms in a material way, we may ask you to agree to
            the new version again.
          </p>

          <blockquote>
            <p>
              <strong>Business Information</strong>
            </p>
            <p>
              Promhance is responsible for the operation and management of the
              Promhance platform, including its services, subscriptions and
              payment processing.
            </p>
            <ul>
              <li>
                <strong>Product Name</strong>: Promhance
              </li>
              <li>
                <strong>Website</strong>:{" "}
                <a href="https://www.promhance.com">https://www.promhance.com</a>
              </li>
            </ul>
          </blockquote>

          <h2>1. Overview of the Service</h2>
          <p>
            Promhance is an AI-powered prompt enhancement tool that helps users
            improve the quality and effectiveness of their prompts for use with AI
            language models.
          </p>
          <p>
            You can start using the Service for free, with or without an account,
            subject to monthly usage limits. We are introducing paid Pro and Power
            subscription plans with higher limits; see Section 4 for the plans,
            usage limits, billing, and our refund policy.
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

          <h2>4. Plans, Usage Limits, Billing and Refunds</h2>

          <h3>4.1 Plans and pricing</h3>
          <p>
            Promhance is offered on the following plans. Prices are in US dollars
            per month and may exclude applicable taxes.
          </p>
          <ul>
            {PLANS.map((plan) => (
              <li key={plan.id}>
                <strong>{plan.name}</strong>:{" "}
                {plan.priceMonthly === 0 ? "$0" : `$${plan.priceMonthly.toFixed(2)} per month`}
                {" "}&mdash; {PLAN_LIMITS[plan.id].enhancementsPerMonth.toLocaleString("en-US")}{" "}
                enhancements per month.
              </li>
            ))}
          </ul>
          {isBillingPublic() ? (
            <p>
              Paid plans are sold as monthly subscriptions through PayPal. The
              terms in Sections 4.3 to 4.5 apply from the moment you purchase one.
              Features marked &ldquo;coming soon&rdquo; on the pricing page are
              not part of what you are buying today.
            </p>
          ) : (
            <p>
              <strong>Paid plans (Pro and Power) are not yet available for
              purchase.</strong>{" "}
              Until they launch, the Free plan and the limits below apply, and no
              payment is taken. The terms in Sections 4.3 to 4.5 apply from the
              moment you purchase a paid plan.
            </p>
          )}

          <h3>4.2 Usage limits and fair use</h3>
          <ul>
            <li>
              <strong>Monthly limits</strong>: Each plan includes a monthly
              allowance. Visitors who are not signed in can run{" "}
              {PLAN_LIMITS.anonymous.enhancementsPerMonth} enhancements per month
              and, with a free account, {PLAN_LIMITS.free.enhancementsPerMonth}.
              Pro includes {PLAN_LIMITS.pro.enhancementsPerMonth.toLocaleString("en-US")} and
              Power {PLAN_LIMITS.power.enhancementsPerMonth.toLocaleString("en-US")}.
              Higher-detail runs, refinements, and Deep Research have their own
              monthly allowances, which we may show on our{" "}
              <Link href="/pricing">pricing page</Link> or in the app.
            </li>
            <li>
              <strong>Resets</strong>: Free and signed-out allowances reset each
              calendar month. Paid allowances reset with each billing period.
              Unused allowance does not roll over.
            </li>
            <li>
              <strong>&ldquo;Unlimited&rdquo; features</strong>: Where a plan
              describes a feature as unlimited, it remains subject to the
              plan&apos;s monthly enhancement allowance and fair use. We may
              throttle or restrict usage that is excessive, automated, or that
              harms the Service for others.
            </li>
            <li>
              <strong>Changes</strong>: We may change plan features and limits
              from time to time. We will give reasonable advance notice of changes
              that materially reduce what a paid plan includes during a period you
              have already paid for.
            </li>
          </ul>

          <h3>4.3 Subscriptions, billing and cancellation</h3>
          <ul>
            <li>
              Paid plans are billed monthly in advance and renew automatically
              until you cancel. Payments are processed by PayPal; we do not store
              your full card details.
            </li>
            <li>
              <strong>Upgrading</strong> from Pro to Power charges the Power price
              immediately and starts a new billing period. Your Pro subscription
              is cancelled and its unused time is not refunded. To move from Power
              to Pro, cancel Power and subscribe to Pro after it ends.
            </li>
            <li>
              You can cancel at any time from your account or by emailing{" "}
              <a href="mailto:admin@promhance.com">admin@promhance.com</a>.
              Cancellation takes effect at the end of the current billing period;
              you keep your plan&apos;s features until then, and you will not be
              charged again.
            </li>
            <li>
              If a payment fails, we may retry it and may restrict your account to
              the Free plan until payment succeeds.
            </li>
            <li>
              We may change prices. For existing subscribers, a price change
              applies from the next billing period after we give you reasonable
              advance notice, and you may cancel before it takes effect.
            </li>
            <li>
              You are responsible for any applicable taxes (such as GST or VAT).
            </li>
          </ul>

          <h3 id="refund-policy" className="scroll-mt-28">4.4 Refund policy</h3>
          <p>
            This policy applies to paid plans.
          </p>
          <ul>
            <li>
              <strong>7-day first-purchase refund</strong>: If you are a new
              paying customer, you can request a full refund of your first
              payment within 7 days of being charged, no questions asked. This
              applies once per customer and does not apply where we reasonably
              find the Service was used abusively or far beyond normal use during
              that period.
            </li>
            <li>
              <strong>Renewals</strong>: Renewal payments are generally
              non-refundable. If you were charged for a renewal you did not
              intend, contact us within 48 hours of the charge and, if you have
              not used the new period&apos;s allowance, we will refund it.
            </li>
            <li>
              <strong>Billing errors</strong>: We will always refund duplicate or
              incorrect charges.
            </li>
            <li>
              <strong>No partial-month refunds</strong>: Outside the cases above,
              we do not refund unused time or allowance when you cancel or
              downgrade, and you keep access until the end of the period you paid
              for.
            </li>
            <li>
              <strong>How to request a refund</strong>: Email{" "}
              <a href="mailto:admin@promhance.com">admin@promhance.com</a> from
              your account email with your request. Approved refunds are returned
              to the original payment method; your bank or payment provider may
              take several business days to show it.
            </li>
            <li>
              Nothing in this policy limits any refund or consumer rights you have
              under the law that applies to you.
            </li>
          </ul>

          <h3>4.5 Beta features</h3>
          <p>
            Some features, such as Deep Research, are labelled &ldquo;Beta.&rdquo;
            They are provided as is, may be inaccurate or change, be limited, or
            be withdrawn at any time, and have their own usage limits. A Deep
            Research run also uses one enhancement from your monthly allowance.
            Research notes are generated by AI models and may contain errors, so
            please verify anything important before relying on it.
          </p>

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
              <strong>Ownership of Promhance</strong>: Promhance owns the
              Promhance platform and all associated intellectual property,
              including the Promhance name, logo, brand assets, website, software,
              and content, except where third-party materials are used under
              license.
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
            Promhance relies on third-party AI/LLM providers (currently
            DeepSeek) to process and enhance prompts, and, once paid plans are
            available, on a third-party payment processor to take payments. While
            we select providers with reasonable data protection standards, we are
            not responsible for the independent practices or availability of these
            third-party services.
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
            (12) months preceding the claim. If you only use the free tier, this
            amount is zero.
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

          <h2>15. Communications and Newsletter</h2>
          <ul>
            <li>
              If you create an account, you may receive our newsletter, which
              includes product updates, prompt tips, and announcements about new
              features. New accounts are opted in by default.
            </li>
            <li>
              You can opt out at any time using the one-click unsubscribe link in
              any newsletter email, visiting our{" "}
              <Link href="/unsubscribe">unsubscribe page</Link>, or changing your
              preference from the site footer. We will honor your request
              promptly.
            </li>
            <li>
              Even after you unsubscribe from the newsletter, we may still send
              you essential service or transactional messages related to your
              account (for example, security notices, confirmation emails, or
              important changes to the Service).
            </li>
          </ul>

          <h2>16. Miscellaneous</h2>
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

          <h2>17. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at:</p>
          <ul>
            <li>
              <strong>Product</strong>: Promhance
            </li>
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
              "The terms and conditions for using Promhance, including plans, usage limits, billing and refunds.",
            dateModified: "2026-11-24",
          }),
        }}
      />

      <Footer />
    </main>
  );
}
