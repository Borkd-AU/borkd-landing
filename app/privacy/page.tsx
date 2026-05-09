// Starting-point template, drafted by an LLM — Joon to have a lawyer review before app store submission.

import type { Metadata } from "next";
import { SiteFooter } from "@/components/landing/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy Policy — Borkd",
  description: "How Borkd collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <>
      <main className="bg-background-primary text-content-primary">
        <div className="mx-auto w-full max-w-[820px] px-6 pb-16 pt-32 sm:px-8 sm:pt-40 lg:pb-24">
          <article className="space-y-10">
            <header className="space-y-3">
              <h1
                className="leading-tight tracking-tight text-content-brand text-[clamp(32px,5vw,48px)]"
                style={{ fontVariationSettings: "'opsz' 14" }}
              >
                Privacy Policy
              </h1>
              <p className="text-sm text-content-secondary">
                <strong className="font-medium">Effective date:</strong> 10 May 2026
              </p>
            </header>

            <p className="text-base leading-relaxed text-content-primary sm:text-lg">
              The short version: we collect the minimum we need to run Borkd,
              we don&rsquo;t sell your data, and we don&rsquo;t track you for
              advertising. The long version is below — it&rsquo;s written
              plainly and we&rsquo;d rather you actually read it.
            </p>

            <p className="text-base leading-relaxed sm:text-lg">
              This Privacy Policy explains how Borkd (&ldquo;we&rdquo;,
              &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and
              protects information when you visit our website at borkd.app or,
              in the future, use our mobile application.
            </p>

            <p className="text-base leading-relaxed sm:text-lg">
              Borkd is operated from Sydney, Australia. We handle personal
              information in line with the Australian Privacy Principles set
              out in the Privacy Act 1988 (Cth). By using our website or
              services, you agree to the practices described in this policy.
            </p>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Who we are
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                Borkd is an early-stage startup building a community-driven
                map for dog owners. We are based in Sydney, Australia. You can
                reach us at{" "}
                <a
                  href="mailto:info@borkd.app"
                  className="text-content-accent underline underline-offset-4"
                >
                  info@borkd.app
                </a>
                .
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                What we collect
              </h2>

              <h3 className="text-xl tracking-tight text-content-primary sm:text-2xl">
                Right now (waitlist phase)
              </h3>
              <p className="text-base leading-relaxed sm:text-lg">
                When you join our waitlist, we collect:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed sm:text-lg">
                <li>Your email address.</li>
                <li>
                  Basic technical information your browser sends automatically
                  (IP address, browser type, device type, the pages you visit,
                  the date and time of your visit).
                </li>
              </ul>

              <h3 className="text-xl tracking-tight text-content-primary sm:text-2xl">
                When the Borkd app launches
              </h3>
              <p className="text-base leading-relaxed sm:text-lg">
                When the app is live and you create an account, we will
                additionally collect:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed sm:text-lg">
                <li>
                  Account information you provide (name, profile details, dog
                  profile information such as breed, size, temperament).
                </li>
                <li>
                  Approximate or precise location, with your explicit
                  permission, used to surface nearby pins.
                </li>
                <li>
                  Content you contribute (pin submissions, reviews, photos,
                  votes).
                </li>
                <li>Usage data (which features you use, how often, how long).</li>
                <li>
                  Device identifiers and crash data, used to keep the app
                  stable.
                </li>
              </ul>
              <p className="text-base leading-relaxed sm:text-lg">
                We will update this policy before the app launches so it
                accurately describes what data the app collects.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                How we use your information
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                We use the information we collect to:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed sm:text-lg">
                <li>
                  Send you waitlist updates and, when you opt in, marketing
                  emails.
                </li>
                <li>
                  Operate, maintain, and improve our website and (in the
                  future) the Borkd app.
                </li>
                <li>Personalise recommendations to you and your dog.</li>
                <li>
                  Detect, prevent, and respond to fraud, abuse, or technical
                  issues.
                </li>
                <li>Comply with our legal obligations.</li>
              </ul>
              <p className="text-base leading-relaxed sm:text-lg">
                We do not sell your personal information.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Sharing
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                We share information only with:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed sm:text-lg">
                <li>
                  <strong className="font-semibold">Service providers</strong>{" "}
                  who help us run our business (for example, our email
                  platform and hosting). They are contractually bound to
                  use the information only on our behalf.
                </li>
                <li>
                  <strong className="font-semibold">Authorities,</strong> when
                  we are legally required to do so or when we believe in good
                  faith it is necessary to protect rights, safety, or
                  property.
                </li>
                <li>
                  <strong className="font-semibold">Other Borkd users,</strong>{" "}
                  when you submit content to the app (for example, pin reviews
                  or photos). Public-facing content is visible to other users
                  by design.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Cookies and analytics
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                We don&rsquo;t currently use non-essential cookies or
                third-party analytics on this website. If that changes,
                we&rsquo;ll update this policy and, where the law requires
                it, ask you for consent.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Your rights
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                Depending on where you live, you may have the right to:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed sm:text-lg">
                <li>Access the personal information we hold about you.</li>
                <li>Ask us to correct or delete your information.</li>
                <li>Object to or restrict certain types of processing.</li>
                <li>
                  Withdraw consent (for example, by unsubscribing from emails).
                </li>
                <li>
                  Lodge a complaint with a data protection authority. In
                  Australia, that is the Office of the Australian Information
                  Commissioner (OAIC).
                </li>
              </ul>
              <p className="text-base leading-relaxed sm:text-lg">
                To exercise any of these rights, email{" "}
                <a
                  href="mailto:info@borkd.app"
                  className="text-content-accent underline underline-offset-4"
                >
                  info@borkd.app
                </a>
                .
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Data retention
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                We keep your information for as long as your relationship with
                us is active, or as long as we need it for the purposes
                described in this policy. After that, we delete or anonymise
                it.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Security
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                We use reasonable technical and organisational measures to
                protect your information. No system is perfectly secure, so we
                cannot guarantee absolute security.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Children
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                Borkd is not directed at children under 16 and we do not
                knowingly collect personal information from them. If you
                believe a child has provided us with personal information,
                contact us and we will delete it.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Changes to this policy
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                We may update this policy from time to time. If we make
                material changes, we will notify you by email or through the
                website. Continued use of Borkd after a change constitutes
                acceptance of the updated policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Governing law
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                This policy is governed by the laws of New South Wales,
                Australia.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Contact
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                Questions or requests:
                <br />
                <a
                  href="mailto:info@borkd.app"
                  className="text-content-accent underline underline-offset-4"
                >
                  info@borkd.app
                </a>
                <br />
                Borkd, Sydney, Australia
              </p>
            </section>
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
