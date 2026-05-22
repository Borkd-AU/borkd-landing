// Starting-point template, drafted by an LLM — Joon to have a lawyer review before app store submission.

import type { Metadata } from "next";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { ReadingShell } from "@/components/landing/ReadingShell";
import { RevealHeading } from "@/components/landing/RevealHeading";

export const metadata: Metadata = {
  title: "Terms of Service — Borkd",
  description:
    "The rules for using the Borkd website and, in the future, the Borkd app.",
};

export default function TermsPage() {
  return (
    <>
      <ReadingShell>
        <main className="bg-background-primary text-content-primary">
          <div className="mx-auto w-full max-w-[820px] px-6 pb-16 pt-32 sm:px-8 sm:pt-40 lg:pb-24">
            <article className="space-y-10">
              <header className="space-y-3">
                <RevealHeading
                  as="h1"
                  className="leading-tight tracking-tight text-content-brand text-[clamp(32px,5vw,48px)]"
                >
                  Terms of Service
                </RevealHeading>
              <p className="text-sm text-content-secondary">
                <strong className="font-medium">Effective date:</strong> 10 May 2026
              </p>
            </header>

            <p className="text-base leading-relaxed text-content-primary sm:text-lg">
              These Terms of Service (&ldquo;Terms&rdquo;) govern your use of
              the Borkd website at borkd.app and, in the future, the Borkd
              mobile application. By using Borkd, you agree to these Terms.
            </p>
            <p className="text-base leading-relaxed sm:text-lg">
              If you do not agree, please do not use Borkd.
            </p>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Who we are
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                Borkd is an early-stage startup based in Sydney, Australia.
                You can reach us at{" "}
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
                What Borkd is
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                Borkd is a community-driven map for dog owners. Today, the
                website allows you to learn about Borkd and join a waitlist.
                When the app launches, it will allow you to find dog-friendly
                venues, read and submit reviews, and contribute information
                to the community.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Eligibility
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                You must be at least 16 years old to use Borkd, or the
                minimum age required in your country for online services,
                whichever is greater.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Your account (when applicable)
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                To use the Borkd app, you will need to create an account. You
                agree to:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed sm:text-lg">
                <li>Provide accurate information.</li>
                <li>Keep your login details confidential.</li>
                <li>
                  Notify us at{" "}
                  <a
                    href="mailto:info@borkd.app"
                    className="text-content-accent underline underline-offset-4"
                  >
                    info@borkd.app
                  </a>{" "}
                  if you suspect unauthorised use of your account.
                </li>
              </ul>
              <p className="text-base leading-relaxed sm:text-lg">
                You are responsible for activity on your account.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                User content
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                When the Borkd app launches, you may submit content — pins,
                reviews, photos, votes, dog profiles, and similar
                contributions (&ldquo;User Content&rdquo;).
              </p>
              <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed sm:text-lg">
                <li>You retain ownership of your User Content.</li>
                <li>
                  By submitting User Content, you grant Borkd a worldwide,
                  non-exclusive, royalty-free licence to host, display,
                  reproduce, modify (for formatting and moderation), and
                  distribute that content in connection with operating and
                  promoting Borkd.
                </li>
                <li>
                  You confirm you have the right to submit the content and
                  that it does not infringe anyone else&rsquo;s rights.
                </li>
                <li>
                  You are responsible for the User Content you submit.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Acceptable use
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                You agree not to:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed sm:text-lg">
                <li>
                  Submit content that is illegal, abusive, harassing,
                  defamatory, deceptive, or that infringes others&rsquo;
                  rights.
                </li>
                <li>
                  Submit pins or reviews that you know to be inaccurate, with
                  intent to mislead.
                </li>
                <li>
                  Spam other users or scrape information from Borkd without
                  permission.
                </li>
                <li>
                  Attempt to interfere with, reverse-engineer, or compromise
                  our systems.
                </li>
                <li>Impersonate another person, business, or venue.</li>
              </ul>
              <p className="text-base leading-relaxed sm:text-lg">
                We may remove content or suspend accounts that violate these
                rules.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Information accuracy
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                Borkd is built on community contributions. We work hard to
                keep information accurate and current, but we cannot
                guarantee that every pin, review, or detail is correct or up
                to date. Always verify directly with venues for things that
                matter to your dog&rsquo;s safety.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Intellectual property
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                The Borkd brand, name, logo, illustrations, design, and
                software are owned by Borkd. You may not copy, modify, or
                distribute them without our written permission.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Third-party services
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                Borkd uses third-party services to operate (for example,
                mapping providers, hosting providers, and email tools). We
                are not responsible for the practices of those third parties.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Disclaimers
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                Borkd is provided &ldquo;as is&rdquo; without warranties of
                any kind. To the fullest extent permitted by law, we disclaim
                all warranties, express or implied, including warranties of
                merchantability, fitness for a particular purpose, and
                non-infringement.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Limitation of liability
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                To the fullest extent permitted by law, Borkd will not be
                liable for any indirect, incidental, special, consequential,
                or punitive damages arising from your use of Borkd, even if
                we were advised of the possibility of such damages.
              </p>
              <p className="text-base leading-relaxed sm:text-lg">
                Nothing in these Terms limits or excludes liability that
                cannot be limited or excluded under applicable law
                (including, in Australia, consumer guarantees under the
                Australian Consumer Law).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Termination
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                You can stop using Borkd at any time. We may suspend or
                terminate access if you breach these Terms or if we need to
                for legal or operational reasons.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Changes to these Terms
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                We may update these Terms from time to time. If we make
                material changes, we will notify you via email or through
                Borkd. Continued use after a change constitutes acceptance of
                the updated Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Governing law and disputes
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                These Terms are governed by the laws of New South Wales,
                Australia. Any disputes will be resolved in the courts of New
                South Wales.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Contact
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
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
      </ReadingShell>
      <SiteFooter />
    </>
  );
}
