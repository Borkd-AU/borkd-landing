import type { Metadata } from "next";
import Image from "next/image";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { RevealScope } from "@/components/landing/RevealScope";
import { RevealHeading } from "@/components/landing/RevealHeading";
import { TiltSpotlightCard } from "@/components/landing/TiltSpotlightCard";

export const metadata: Metadata = {
  title: "For venues — Borkd",
  description:
    "Get found by Sydney's dog owners. Be one of the first venues featured on Borkd.",
};

export default function ForVenuesPage() {
  return (
    <>
      <main className="bg-background-brand text-content-primary">
        <div className="mx-auto w-full max-w-[820px] px-6 pb-16 pt-32 sm:px-8 sm:pt-40 lg:pb-24">
          <RevealScope>
            <article className="space-y-12">
              <header className="space-y-8">
                <RevealHeading
                  as="h1"
                  className="leading-tight tracking-tight text-content-brand text-[clamp(32px,6vw,56px)]"
                >
                  Get found by Sydney&rsquo;s pup parents
                </RevealHeading>
                <div data-reveal className="flex justify-center">
                  <Image
                    src="/images/girl-at-cafe.svg"
                    alt=""
                    width={297}
                    height={315}
                    className="h-auto w-52 sm:w-72"
                  />
                </div>
              </header>

              <p data-reveal className="text-lg leading-relaxed sm:text-xl">
                Borkd is a vetted map of dog-friendly places, made by the
                people who actually go there. Cafes that go above and beyond.
                Parks with proper amenities. Beaches that genuinely welcome
                dogs. If you run a venue that fits, we&rsquo;d love you on the
                map.
              </p>

              <section className="space-y-6">
                <h2
                  data-reveal
                  className="text-2xl tracking-tight text-content-brand sm:text-3xl"
                >
                  What being on Borkd looks like
                </h2>

                {/* Top 3 value props as tilt+spotlight cards. Card-only is a
                    deliberate choice — bento grid felt template-y for our brand.
                    The 4th bullet (future venue messaging) lives below as a
                    one-line afterthought, intentionally lower commitment. */}
                <div data-reveal className="grid gap-4 sm:gap-5">
                  <TiltSpotlightCard
                    number="01"
                    title="Real visibility, with intent"
                  >
                    Pup parents arrive actively searching for somewhere to take
                    their dog. They&rsquo;re choosing, not browsing.
                  </TiltSpotlightCard>
                  <TiltSpotlightCard
                    number="02"
                    title="A profile built for what actually matters"
                  >
                    Outdoor seating,{" "}
                    <span className="borkd-emoji-word" data-emoji="🥣">water bowls</span>,
                    fenced areas, off-leash access — surface the details dog
                    owners care about.
                  </TiltSpotlightCard>
                  <TiltSpotlightCard
                    number="03"
                    title="Trust signals built in"
                  >
                    Reviews from{" "}
                    <span className="borkd-emoji-word" data-emoji="🐾">real dog owners</span>,
                    recency indicators, verified-venue badges as the platform
                    grows.
                  </TiltSpotlightCard>
                </div>

                <p
                  data-reveal
                  className="text-sm leading-relaxed text-content-primary/70 sm:text-base"
                >
                  And, down the road, a direct line to your customers when we
                  open up venue messaging.
                </p>
              </section>

              <section className="space-y-4">
                <h2
                  data-reveal
                  className="text-2xl tracking-tight text-content-brand sm:text-3xl"
                >
                  We&rsquo;re building this with venues, not just for them
                </h2>
                <p data-reveal className="text-base leading-relaxed sm:text-lg">
                  We&rsquo;re early. The first venues on Borkd will help shape
                  what the platform becomes for businesses — what info matters,
                  what features earn their keep, what we should never build.
                </p>
                <p data-reveal className="text-base leading-relaxed sm:text-lg">
                  If that sounds like you, get in touch.
                </p>
              </section>

              <section className="space-y-4">
                <h2
                  data-reveal
                  className="text-2xl tracking-tight text-content-brand sm:text-3xl"
                >
                  Get in touch
                </h2>
                <p data-reveal className="text-base leading-relaxed sm:text-lg">
                  Email{" "}
                  <a
                    href="mailto:info@borkd.app?subject=Borkd%20%E2%80%94%20venue%20interest"
                    className="text-content-accent underline underline-offset-4"
                  >
                    info@borkd.app
                  </a>{" "}
                  with a quick note about your venue. We&rsquo;ll come back
                  with how to get started.
                </p>
              </section>

              <p
                data-reveal
                className="pt-4 text-center text-2xl text-content-brand sm:text-3xl"
              >
                <em className="borkd-emoji-word font-display italic" data-emoji="📍">Good places, found.</em>
              </p>
            </article>
          </RevealScope>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
