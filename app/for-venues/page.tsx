import type { Metadata } from "next";
import Image from "next/image";
import { SiteFooter } from "@/components/landing/SiteFooter";

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
          <article className="space-y-12">
            <header className="space-y-8">
              <h1
                className="leading-tight tracking-tight text-content-brand text-[clamp(32px,6vw,56px)]"
                style={{ fontVariationSettings: "'opsz' 14" }}
              >
                Get found by Sydney&rsquo;s pup parents
              </h1>
              <div className="flex justify-center">
                <Image
                  src="/images/girl-at-cafe.svg"
                  alt=""
                  width={297}
                  height={315}
                  className="h-auto w-[220px] sm:w-[280px]"
                />
              </div>
            </header>

            <p className="text-lg leading-relaxed sm:text-xl">
              Borkd is a vetted map of dog-friendly places, made by the
              people who actually go there. Cafes that go above and beyond.
              Parks with proper amenities. Beaches that genuinely welcome
              dogs. If you run a venue that fits, we&rsquo;d love you on the
              map.
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                What being on Borkd looks like
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed sm:text-lg">
                <li>
                  <em className="font-display italic">Real visibility</em>{" "}
                  with pup parents actively searching for somewhere to take
                  their dog. Borkd users arrive with intent — they&rsquo;re
                  choosing, not browsing.
                </li>
                <li>
                  A profile that surfaces what makes your venue dog-friendly:
                  outdoor seating, water bowls, fenced areas, off-leash
                  access, the things that actually matter.
                </li>
                <li>
                  Trust signals built in. Reviews from real dog owners,
                  recency indicators, verified-venue badges as the platform
                  grows.
                </li>
                <li>
                  A future direct line to your customers, when we open up
                  venue messaging.
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                We&rsquo;re building this with venues, not just for them
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
                We&rsquo;re early. The first venues on Borkd will help shape
                what the platform becomes for businesses — what info matters,
                what features earn their keep, what we should never build.
              </p>
              <p className="text-base leading-relaxed sm:text-lg">
                If that sounds like you, get in touch.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl tracking-tight text-content-brand sm:text-3xl">
                Get in touch
              </h2>
              <p className="text-base leading-relaxed sm:text-lg">
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

            <p className="pt-4 text-center text-2xl text-content-brand sm:text-3xl">
              <em className="font-display italic">Good places, found.</em>
            </p>
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
