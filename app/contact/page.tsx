import type { Metadata } from "next";
import Image from "next/image";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { RevealScope } from "@/components/landing/RevealScope";
import { RevealHeading } from "@/components/landing/RevealHeading";
import { BigLinkRow } from "@/components/landing/BigLinkRow";

export const metadata: Metadata = {
  title: "Contact — Borkd",
  description: "Reach the Borkd team — for venues, partnerships, and general queries.",
};

export default function ContactPage() {
  return (
    <>
      <main className="bg-background-brand text-content-primary">
        <div className="mx-auto w-full max-w-[820px] px-6 pb-16 pt-32 sm:px-8 sm:pt-40 lg:pb-24">
          <RevealScope>
            {/* Hero — split column on lg+: small eyebrow + huge headline on
                the left, character illustration on the right. Single column
                on mobile. Breaks the "centered article" pattern the other
                subpages use, on purpose. */}
            {/* Hero — 1:1 split on lg+ so the illustration carries equal
                weight to the headline. Below lg, single column with the
                illustration above the text for a mobile-friendly stack.
                items-center keeps the (now taller) illustration aligned to
                the headline's vertical midpoint. */}
            <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-6">
                <p
                  data-reveal
                  className="font-display text-sm uppercase tracking-widest text-content-accent/80"
                >
                  Say hi
                </p>
                {/* Intentional 2-line break: "Drop us" / "a line." reads
                    as deliberate display typography. Letting clamp+wrap
                    decide produced an awkward "Drop us a / line." with
                    one orphaned word. <br/> survives SplitText's chars+
                    words split as a literal line break. */}
                <RevealHeading
                  as="h1"
                  className="leading-[1.02] tracking-tight text-content-brand text-[clamp(40px,8vw,88px)]"
                >
                  Drop us<br />a line.
                </RevealHeading>
                <p
                  data-reveal
                  className="max-w-md text-lg leading-relaxed text-content-primary/85 sm:text-xl"
                >
                  We&rsquo;re a small Sydney team. We read everything that
                  lands in our inbox and aim to come back within a couple of
                  working days &mdash; usually faster.
                </p>
              </div>
              {/* Illustration sized to balance the 88px headline — max-h
                  caps the tall SVG so it doesn't push the row height; width
                  steps follow the Tailwind default scale per design rules. */}
              <div data-reveal className="flex justify-center lg:justify-end">
                <Image
                  src="/images/girl-2.svg"
                  alt=""
                  width={300}
                  height={320}
                  className="h-auto max-h-96 w-48 object-contain sm:w-56 lg:w-64"
                  priority
                />
              </div>
            </section>

            {/* Big-link list — replaces the card grid pattern. Each row is a
                full-width inbox link; hovering the row reveals an arrow and
                shifts the headline right. */}
            <section data-reveal className="mt-20 sm:mt-28 lg:mt-32">
              <div className="mb-8 flex items-baseline justify-between sm:mb-10">
                <h2
                  className="tracking-tight text-content-brand text-[clamp(20px,2.5vw,28px)]"
                  style={{ fontVariationSettings: "'opsz' 14" }}
                >
                  Pick the right inbox
                </h2>
                <span className="font-display text-xs uppercase tracking-widest text-content-primary/50 sm:text-sm">
                  Three&nbsp;ways
                </span>
              </div>

              <div className="flex flex-col">
                <BigLinkRow
                  eyebrow="General"
                  href="mailto:info@borkd.app"
                  description={
                    <>
                      Questions, waitlist, what we&rsquo;re building, or just
                      to say hello.
                    </>
                  }
                >
                  info@borkd.app
                </BigLinkRow>
                <BigLinkRow
                  eyebrow="Venues"
                  href="mailto:info@borkd.app?subject=Borkd%20%E2%80%94%20venue%20interest"
                  description={
                    <>
                      Cafes, parks, beaches, stays that genuinely welcome
                      dogs. Same inbox &mdash; flag the subject.
                    </>
                  }
                >
                  Venues &amp; partnerships
                </BigLinkRow>
                <BigLinkRow
                  eyebrow="Press"
                  href="mailto:info@borkd.app?subject=Borkd%20%E2%80%94%20press"
                  description={
                    <>
                      Writing about us or dog culture in Sydney? Tell us what
                      you&rsquo;re on and when.
                    </>
                  }
                >
                  Press &amp; media
                </BigLinkRow>
              </div>
            </section>

            {/* Footer line — collapses the old "Where we are" section into
                one editorial sign-off. Centered, large, italic-display
                accent on the city name. */}
            <section
              data-reveal
              className="mt-20 flex flex-col items-center gap-3 text-center sm:mt-28"
            >
              <p className="font-display text-xs uppercase tracking-widest text-content-primary/50 sm:text-sm">
                Built in
              </p>
              <p
                className="tracking-tight text-content-brand text-[clamp(32px,5vw,48px)]"
                style={{ fontVariationSettings: "'opsz' 14" }}
              >
                <em className="font-display italic">Sydney</em>, AU
              </p>
              <p className="max-w-md text-sm leading-relaxed text-content-primary/70 sm:text-base">
                No office to drop in to yet &mdash; mail us at the addresses
                above and we&rsquo;ll come back as fast as we can.
              </p>
            </section>
          </RevealScope>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
