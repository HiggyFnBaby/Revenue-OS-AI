import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { COMPANY_NAME, PRODUCT_NAME, LEGAL_CONTACT_EMAIL, SUBPROCESSORS } from "@/lib/legal";

// Rendered per request rather than prerendered at build: the contact email,
// company name, and governing law come from environment variables, and a
// prerendered page would freeze whatever they were when the build ran.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: `Privacy Policy — ${PRODUCT_NAME}` };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This Privacy Policy explains what {COMPANY_NAME} (&ldquo;we,&rdquo; &ldquo;us&rdquo;) collects when you
        use {PRODUCT_NAME} (the &ldquo;Service&rdquo;), how we use it, who we share it with, and the choices you
        have. It is written to describe what the Service actually does today.
      </p>

      <h2>1. Information we collect</h2>
      <p>
        <strong>Account information.</strong> When you create a workspace we collect your name (optional), email
        address, a workspace name, and a password. We store the password only as a one-way hash; we cannot read
        it.
      </p>
      <p>
        <strong>Customer Data you enter.</strong> Lead records (name, company, contact details, notes), the
        pipeline stage of each lead, tasks, and stage-change history. This will often include personal
        information about other people, your leads. You decide what to enter; we store it to provide the Service.
      </p>
      <p>
        <strong>AI agent runs.</strong> When you run an agent on a lead, we store the input we sent to the model
        and the output it returned, attached to that lead, so later steps and your teammates can see what was
        produced.
      </p>
      <p>
        <strong>Billing information.</strong> If you subscribe, our payment processor (Stripe) collects your
        payment details directly. We receive and store your Stripe customer and subscription identifiers, the
        subscription&rsquo;s status, and its renewal date. We never receive or store your full card number.
      </p>
      <p>
        <strong>Technical and log data.</strong> Our hosting provider records standard request logs (IP address,
        browser type, pages requested, timestamps, and errors) which we use to operate, secure, and debug the
        Service.
      </p>
      <p>
        <strong>Password reset requests.</strong> When you ask to reset your password we store a one-way hash of
        the emailed reset token for up to one hour.
      </p>

      <h2>2. How we use information</h2>
      <ul>
        <li>To provide the Service: authenticate you, store and display your workspace, run agents you request.</li>
        <li>To bill you and manage your subscription.</li>
        <li>To send transactional email, such as password reset links. We do not send marketing email.</li>
        <li>To secure the Service, enforce usage limits, prevent abuse, and debug problems.</li>
        <li>To comply with law and enforce our <Link href="/terms">Terms of Service</Link>.</li>
      </ul>
      <p>
        We do not sell your information, and we do not use your Customer Data to train AI models. Our AI provider
        processes agent-run inputs to generate a response under terms that do not permit it to train on that data.
      </p>

      <h2>3. Cookies</h2>
      <p>
        The Service sets a single session cookie after you log in so that you stay logged in. It is strictly
        necessary for the Service to work. We do not use advertising or third-party analytics cookies.
      </p>

      <h2>4. Who we share information with</h2>
      <p>
        We share information only with the providers below, each of which processes it on our behalf to run the
        Service, and with authorities where the law requires.
      </p>
      <ul>
        {SUBPROCESSORS.map((s) => (
          <li key={s.name}>
            <strong>{s.name}</strong> &mdash; {s.purpose} ({s.location}).
          </li>
        ))}
      </ul>
      <p>
        When you run an agent, that lead&rsquo;s details, your notes on it, and prior agent outputs for it are
        sent to Anthropic to generate the response. Nothing is sent unless you choose to run an agent.
      </p>

      <h2>5. Your leads&rsquo; information</h2>
      <p>
        Where data protection law distinguishes controllers from processors, you are the controller of the
        personal information you enter about your leads, and we process it on your instructions to provide the
        Service. You are responsible for having a lawful basis to collect it and to contact those people. If
        someone contacts us about information you have entered about them, we will refer them to you unless the
        law requires otherwise.
      </p>

      <h2>6. Retention</h2>
      <ul>
        <li>Account and Customer Data are kept for as long as your workspace exists.</li>
        <li>When you ask us to delete your workspace, we delete it and its Customer Data within 30 days, except
          for billing records we must keep for tax and accounting purposes.</li>
        <li>Password reset tokens expire after one hour.</li>
        <li>Hosting request logs are retained by our hosting provider for a limited period under its standard settings.</li>
      </ul>

      <h2>7. Security</h2>
      <p>
        Data is encrypted in transit (TLS). Passwords are stored as bcrypt hashes. Each workspace&rsquo;s data is
        isolated so that no other workspace can read it. Access to production systems is limited to the people
        who operate the Service. No system is perfectly secure; if we learn of a breach affecting your data we
        will notify you as the law requires.
      </p>

      <h2>8. Your rights and choices</h2>
      <p>
        Depending on where you live, you may have the right to access, correct, export, or delete your personal
        information, to object to or restrict certain processing, and to complain to a supervisory authority.
        You can update your name and workspace details in the Service, reset your password from the login page,
        and manage your subscription from the Billing page. For anything else, including export or deletion of
        your workspace, email <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>. We will
        respond within 30 days.
      </p>

      <h2>9. International transfers</h2>
      <p>
        The Service is operated from, and the providers listed above store data in, the United States. If you use
        the Service from elsewhere, your information is transferred to and processed in the United States.
      </p>

      <h2>10. Children</h2>
      <p>The Service is for business use by adults. We do not knowingly collect information from anyone under 18.</p>

      <h2>11. Changes to this policy</h2>
      <p>
        We may update this policy as the Service changes. We will post the new version here with a new effective
        date and, for material changes, notify you by email or in the Service.
      </p>

      <h2>12. Contact</h2>
      <p>
        Privacy questions and requests: <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
