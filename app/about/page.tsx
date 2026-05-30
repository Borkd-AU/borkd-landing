import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { RevealScope } from "@/components/landing/RevealScope";
import { RevealHeading } from "@/components/landing/RevealHeading";

export const metadata: Metadata = {
  title: "About — Borkd",
  description:
    "Why Borkd exists, who built it, and what we believe about taking your dog out.",
};

export default function AboutPage() {
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
                  Why Borkd exists
                </RevealHeading>
                <div data-reveal className="flex justify-center">
                  <Image
                    src="/images/golden-retriever.svg"
                    alt=""
                    width={227}
                    height={191}
                    className="h-auto w-48 sm:w-64"
                  />
                </div>
              </header>

              <p data-reveal className="text-lg leading-relaxed sm:text-xl">
                If you&rsquo;ve ever stood outside a cafe wondering whether{" "}
                <em className="font-display italic">&ldquo;dog-friendly&rdquo;</em>{" "}
                actually means your dog is welcome, or driven half an hour to a{" "}
                <span className="borkd-emoji-word" data-emoji="🏖️">beach</span>{" "}
                only to find a no-dogs sign at the gate, this is for you.
              </p>
              <p data-reveal className="text-lg leading-relaxed sm:text-xl">
                Borkd is the map we wish existed — built by pup parents, for pup
                parents.
              </p>

              <section className="space-y-4">
                <h2
                  data-reveal
                  className="text-2xl tracking-tight text-content-brand sm:text-3xl"
                >
                  The problem we kept hitting
                </h2>
                <p data-reveal className="text-base leading-relaxed sm:text-lg">
                  Sydney has plenty of places that are technically dog-friendly.
                  Finding the ones that{" "}
                  <em className="borkd-emoji-word font-display italic" data-emoji="✨">genuinely</em> are means
                  bouncing between Google Maps, TikTok, Facebook groups, and a
                  couple of friends who happen to own the same breed as you.
                  Photos are old. Reviews don&rsquo;t mention dogs. Half the
                  time &ldquo;dog-friendly&rdquo; just means &ldquo;tolerated.&rdquo;
                </p>
                <p data-reveal className="text-base leading-relaxed sm:text-lg">
                  That&rsquo;s a lot of homework before what&rsquo;s meant to be
                  a relaxing outing.
                </p>
              </section>

              {/* Pull-quote — lifted from the "What we believe" list so it
                  gets the room it deserves. The thin violet rules above and
                  below separate it from the body without a heavy card. */}
              <figure data-reveal className="py-6 sm:py-10">
                <div className="border-t border-content-accent/40" />
                <blockquote className="px-2 py-8 text-center sm:py-12">
                  <p
                    className="font-display italic leading-tight text-content-brand text-[clamp(28px,4.5vw,44px)]"
                    style={{ fontVariationSettings: "'opsz' 14" }}
                  >
                    &ldquo;Dog-friendly&rdquo; should mean actually friendly.
                  </p>
                  <p className="mt-4 text-sm text-content-primary/70 sm:text-base">
                    Not just tolerant.
                  </p>
                </blockquote>
                <div className="border-b border-content-accent/40" />
              </figure>

              <section className="space-y-4">
                <h2
                  data-reveal
                  className="text-2xl tracking-tight text-content-brand sm:text-3xl"
                >
                  What we believe
                </h2>
                <ul
                  data-reveal
                  className="list-disc space-y-2 pl-6 text-base leading-relaxed sm:text-lg"
                >
                  <li>Information is only useful if it&rsquo;s recent and trusted.</li>
                  <li>
                    The people who know best are the people already there with
                    their dogs.
                  </li>
                  <li>
                    Every dog is different — recommendations should know that.
                  </li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2
                  data-reveal
                  className="text-2xl tracking-tight text-content-brand sm:text-3xl"
                >
                  What we&rsquo;re building
                </h2>
                <p data-reveal className="text-base leading-relaxed sm:text-lg">
                  A vetted map of dog-friendly Sydney, made by the people who
                  actually go there. Walking trails, cafes, beaches, parks,
                  stays — all filtered by what matters for your dog. Alerts
                  from the community when something changes on the ground. A
                  profile for your dog so the recommendations actually fit.
                </p>
                <p data-reveal className="text-base leading-relaxed sm:text-lg">
                  We&rsquo;re starting in Sydney because that&rsquo;s where we
                  live, where our dogs live, and where we know the suburbs by
                  heart. Once it works here, we&rsquo;ll grow.
                </p>
              </section>

              <section className="space-y-4">
                <h2
                  data-reveal
                  className="text-2xl tracking-tight text-content-brand sm:text-3xl"
                >
                  Who&rsquo;s building it
                </h2>
                <p data-reveal className="text-base leading-relaxed sm:text-lg">
                  A small Sydney team — designers, engineers, founders. Dog
                  people first, builders second. We started Borkd because the
                  version we wanted to use didn&rsquo;t exist, and the dogs in
                  our lives weren&rsquo;t getting any younger.
                </p>
                <p data-reveal className="text-base leading-relaxed sm:text-lg">
                  Every habit, every quirk, every walk where the spot
                  didn&rsquo;t quite work out — they shaped every decision we
                  made along the way.
                </p>
              </section>

              <section className="space-y-4">
                <h2
                  data-reveal
                  className="text-2xl tracking-tight text-content-brand sm:text-3xl"
                >
                  Want in?
                </h2>
                <p data-reveal className="text-base leading-relaxed sm:text-lg">
                  We&rsquo;re early. The first wave of pup parents on Borkd
                  will help shape what it becomes — every spot they add, every
                  review they leave, makes the map sharper for everyone after
                  them.
                </p>
                <p data-reveal className="text-base leading-relaxed sm:text-lg">
                  If that sounds like you,{" "}
                  <Link
                    href="/#waitlist"
                    className="text-content-accent underline underline-offset-4"
                  >
                    join the waitlist
                  </Link>
                  . We&rsquo;ll be in touch when there&rsquo;s something worth
                  opening.
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
