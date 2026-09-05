import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { TRIAL_DAYS } from "@/lib/access";
import { COMPANY_NAME, PRODUCT_NAME, LEGAL_CONTACT_EMAIL, GOVERNING_LAW } from "@/lib/legal";

// Rendered per request rather than prerendered at build: the contact email,
// company name, and governing law come from environment variables, and a
// prerendered page would freeze whatever they were when the build ran.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: `Terms of Service — ${PRODUCT_NAME}` };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These Terms of Service (the &ldquo;Terms&rdquo;) are an agreement between you and {COMPANY_NAME}
        (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) governing your use of {PRODUCT_NAME}, the
        web application and related services (the &ldquo;Service&rdquo;). By creating a workspace or using the
        Service, you agree to these Terms. If you are using the Service on behalf of a business, you represent
        that you have authority to bind that business, and &ldquo;you&rdquo; refers to it.
      </p>

      <h2>1. The Service</h2>
      <p>
        {PRODUCT_NAME} is a customer relationship management tool. You record leads and move them through a
        pipeline, and you can ask the Service to run AI agents on a lead to produce research, offer, messaging,
        and conversation suggestions. We may change, add, or remove features at any time. We will give
        reasonable notice of changes that materially reduce the Service&rsquo;s core functionality.
      </p>

      <h2>2. Accounts and workspaces</h2>
      <ul>
        <li>You must be at least 18 years old and provide accurate account information.</li>
        <li>
          You are responsible for keeping your password confidential and for all activity in your workspace.
          Tell us promptly at <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> if you believe
          your account has been accessed without authorization.
        </li>
        <li>One person may create one workspace per email address. Each workspace&rsquo;s data is private to it.</li>
      </ul>

      <h2>3. Free trial, subscriptions, and payment</h2>
      <ul>
        <li>
          New workspaces receive a free trial of {TRIAL_DAYS} days. No payment method is required to start. When
          the trial ends, the workspace is locked until a subscription is started; your data is retained.
        </li>
        <li>
          Subscriptions are billed in advance on a recurring basis at the price shown at checkout, through our
          payment processor, Stripe. We do not store your card number.
        </li>
        <li>
          You can cancel at any time from the Billing page (&ldquo;Manage billing&rdquo;). Cancellation takes effect
          at the end of the current billing period, and you keep access until then. Except where required by
          law, fees already paid are not refunded for partial periods.
        </li>
        <li>
          If a payment fails, we may suspend access to the Service until it is resolved. We may change prices
          with at least 30 days&rsquo; notice by email; the new price applies from your next billing period.
        </li>
        <li>Prices exclude any taxes, which you are responsible for where they apply.</li>
      </ul>

      <h2>4. Your data</h2>
      <ul>
        <li>
          You own the data you enter into the Service, including lead records, notes, and the outputs generated
          for your workspace (&ldquo;Customer Data&rdquo;). You grant us a limited license to host, process, and
          display Customer Data solely to provide and support the Service.
        </li>
        <li>
          Customer Data will often include personal information about other people (your leads). You are
          responsible for having a lawful basis to collect it, enter it, and contact those people, and for
          complying with laws that apply to your outreach, such as anti-spam and telemarketing rules.
        </li>
        <li>
          We process Customer Data as described in our <Link href="/privacy">Privacy Policy</Link>. Where data
          protection law treats you as the controller of your leads&rsquo; information, we act as your processor
          and process it only on your instructions as expressed through the Service.
        </li>
        <li>You can request export or deletion of your workspace data at any time by emailing us.</li>
      </ul>

      <h2>5. AI features</h2>
      <ul>
        <li>
          When you run an agent on a lead, the lead&rsquo;s details, your notes, and prior agent outputs for that
          lead are sent to our AI provider (Anthropic) to generate a response. Agents run only when you choose to
          run them.
        </li>
        <li>
          AI outputs are suggestions generated by a language model. They can be inaccurate, incomplete, or
          unsuitable for your situation. You are responsible for reviewing them before relying on or acting on
          them. Nothing generated by the Service is legal, financial, or professional advice.
        </li>
        <li>
          Agent runs are subject to reasonable usage limits per workspace to protect the Service. The current
          limits are shown to you if you reach them.
        </li>
      </ul>

      <h2>6. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use the Service to send unsolicited or unlawful communications, or to harass anyone;</li>
        <li>enter data you do not have the right to use, or that is unlawful to collect or store;</li>
        <li>attempt to access another workspace&rsquo;s data or interfere with the Service or its security;</li>
        <li>use automated means to access the Service beyond its intended interface, or to circumvent usage limits;</li>
        <li>resell the Service, or use it to build a competing product by systematically extracting its outputs;</li>
        <li>use the Service for anything illegal.</li>
      </ul>

      <h2>7. Intellectual property</h2>
      <p>
        We own the Service, including its software, design, agent prompts, and branding. These Terms do not
        transfer any of that to you. You may not copy, modify, or reverse engineer the Service except as the law
        expressly allows. Feedback you send us may be used without obligation to you.
      </p>

      <h2>8. Third-party services</h2>
      <p>
        The Service relies on third-party providers for hosting, database, payments, AI, and email. Their
        availability affects ours. Your use of Stripe&rsquo;s checkout and billing portal is also subject to
        Stripe&rsquo;s terms.
      </p>

      <h2>9. Termination</h2>
      <ul>
        <li>You may stop using the Service and request deletion of your workspace at any time.</li>
        <li>
          We may suspend or terminate your access if you materially breach these Terms, if required by law, or if
          your subscription lapses. Where practical we will give you notice and a chance to fix the problem.
        </li>
        <li>
          After termination we may delete Customer Data following a reasonable retention period. Sections that by
          their nature should survive (including 4, 7, 10, 11, and 12) do so.
        </li>
      </ul>

      <h2>10. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE.&rdquo; TO THE FULLEST EXTENT PERMITTED
        BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A
        PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR
        ERROR-FREE, OR THAT AI OUTPUTS WILL BE ACCURATE OR PRODUCE ANY PARTICULAR BUSINESS RESULT.
      </p>

      <h2>11. Limitation of liability</h2>
      <p>
        TO THE FULLEST EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
        CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, REVENUE, DATA, OR GOODWILL, ARISING FROM OR
        RELATED TO THE SERVICE. OUR TOTAL LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE IS LIMITED TO THE
        AMOUNT YOU PAID US IN THE TWELVE MONTHS BEFORE THE CLAIM AROSE. Some jurisdictions do not allow certain
        limitations, so parts of this section may not apply to you.
      </p>

      <h2>12. Indemnity</h2>
      <p>
        You will defend and indemnify us against claims arising from your Customer Data, your communications
        with leads, or your breach of these Terms or applicable law.
      </p>

      <h2>13. Changes to these Terms</h2>
      <p>
        We may update these Terms. If a change is material we will notify you by email or in the Service at least
        14 days before it takes effect. Continued use after that date means you accept the updated Terms.
      </p>

      <h2>14. Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of {GOVERNING_LAW}, without regard to conflict-of-law rules. Before
        filing a claim, each of us agrees to try in good faith to resolve the dispute by contacting the other
        first.
      </p>

      <h2>15. Contact</h2>
      <p>
        Questions about these Terms: <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
