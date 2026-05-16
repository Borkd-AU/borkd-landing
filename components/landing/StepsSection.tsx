"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { StepCard } from "./StepCard";

const steps = [
  {
    number: 1 as const,
    title: "Tell us about your dog.",
    body: "Breed, size, energy, the quirks. So a great dane never ends up at a tiny cocktail bar.",
  },
  {
    number: 2 as const,
    title: "Discover places you'll both love.",
    body: "Parks, cafés, beaches, stays. Vouched for by owners, kept fresh by the people who go there.",
  },
  {
    number: 3 as const,
    title: "Walk out the door with confidence.",
    body: "No research. No surprises. Just a good outing.",
  },
];

/**
 * Section 3 — pinned scroll storytelling, adapts direction by breakpoint.
 *
 * ≥ lg (desktop): horizontal pan
 *   Cards live in a flex-row track. The focus viewport is one card
 *   wide. GSAP translates the track on X as the user scrolls — Step 1
 *   → 2 → 3 slide through left-to-right. Hero composite sits in the
 *   right column.
 *
 * < lg (mobile / tablet): vertical pan
 *   Cards live in a flex-col track. The focus viewport is one card
 *   tall. GSAP translates the track on Y. Same Step 1 → 2 → 3 beats,
 *   just rotated 90°. No hero composite (hidden below lg).
 *
 * Both directions:
 *   • 2.5 viewports of pinned scroll, scrub: 0.1
 *   • ScrollTrigger snap pulls to the nearest step label
 *   • Headline slide-in beat at the start
 *
 * Reduced-motion users skip the pin entirely and see a static stack.
 */
export function StepsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const headline = headlineRef.current;
      const track = trackRef.current;
      const stage = stageRef.current;
      const focus = focusRef.current;
      if (!section || !headline || !track || !stage || !focus) return;

      const mm = gsap.matchMedia();

      // Desktop branch only. Below lg the cards are a native
      // horizontal swipe carousel (CSS scroll-snap, see markup) — no
      // GSAP pin there, so finger swipe / momentum / a11y come for
      // free and ScrollSmoother's vertical normalizeScroll never
      // fights an internal scroller.
      //
      // Reduced-motion (desktop): the lg flex-row layout already lays
      // all three cards out side by side, so clearing GSAP props
      // leaves a readable static row.
      mm.add(
        "(min-width: 1024px) and (prefers-reduced-motion: reduce)",
        () => {
          gsap.set([headline, track], { clearProps: "all" });
        }
      );

      // Desktop branch — pinned horizontal pan, Step 1 → 2 → 3.
      mm.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          const hero = heroRef.current;
          // Hero baseline transform — vertically centre the absolutely
          // -positioned hero before the timeline takes over. Replaces
          // Tailwind's `-translate-y-1/2` which GSAP would otherwise
          // clobber on the first tween tick.
          if (hero) gsap.set(hero, { yPercent: -50 });

          const offsetForCard = (n: number) => {
            const card = track.children[n] as HTMLElement | undefined;
            return card ? -card.offsetLeft : 0;
          };

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${window.innerHeight * 2.5}`,
              pin: true,
              scrub: 0.1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              snap: {
                snapTo: "labelsDirectional",
                duration: { min: 0.2, max: 0.5 },
                delay: 0.05,
                ease: "power2.inOut",
              },
            },
          });

          // Headline slide-in.
          tl.fromTo(
            headline,
            { xPercent: 30, opacity: 0 },
            { xPercent: 0, opacity: 1, ease: "power2.out", duration: 0.5 },
            0
          );

          // Hero composite slides in alongside the headline — slightly
          // slower so it reads as a separate beat. The xPercent tween
          // is independent from the parallax yPercent tween below so
          // both layer cleanly on the single transform.
          if (hero) {
            tl.fromTo(
              hero,
              { xPercent: 25, opacity: 0 },
              { xPercent: 0, opacity: 1, ease: "power2.out", duration: 0.6 },
              0
            );
          }

          // Track enters from off-stage and lands Step 1.
          tl.fromTo(
            track,
            { x: () => focus.clientWidth },
            {
              x: () => offsetForCard(0),
              ease: "power2.out",
              duration: 0.5,
            }
          );
          tl.addLabel("step-1");
          tl.to({}, { duration: 0.3 });

          // Step 2.
          tl.to(track, {
            x: () => offsetForCard(1),
            ease: "power2.inOut",
            duration: 0.3,
          });
          tl.addLabel("step-2");
          tl.to({}, { duration: 0.3 });

          // Step 3.
          tl.to(track, {
            x: () => offsetForCard(2),
            ease: "power2.inOut",
            duration: 0.3,
          });
          tl.addLabel("step-3");
          tl.to({}, { duration: 0.3 });

          // Subtle parallax on the hero composite for the entire pinned
          // duration — yPercent drifts ~6% around the -50 baseline so
          // it never looks frozen while the cards are panning.
          if (hero) {
            tl.fromTo(
              hero,
              { yPercent: -53 },
              { yPercent: -47, ease: "none", duration: 2.5 },
              0
            );
          }

          document.fonts?.ready.then(() => ScrollTrigger.refresh());
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="steps"
      className="relative w-full bg-background-brand"
    >
      <div
        ref={stageRef}
        className="
          relative mx-auto flex max-w-[1440px] flex-col gap-8 px-6
          py-[clamp(48px,10vh,120px)]
          sm:gap-10 sm:px-12
          lg:min-h-[clamp(720px,80vh,840px)] lg:justify-center lg:gap-12
          lg:px-[clamp(48px,16vw,235px)]
        "
      >
        <h2
          ref={headlineRef}
          className="max-w-[1168px] leading-tight tracking-tight text-content-brand text-[clamp(28px,5vw,50px)] lg:max-w-[clamp(280px,30vw,460px)]"
          style={{ fontVariationSettings: "'opsz' 14" }}
        >
          Think Google Maps, but made for{" "}
          <em className="font-display italic">
            your dog&rsquo;s unique needs.
          </em>
        </h2>

        {/* Focus viewport.

            < lg (mobile / tablet): a native horizontal swipe carousel.
            `overflow-x-auto` + `snap-x snap-mandatory` lets the user
            flick cards left/right with the finger; the browser handles
            momentum + snap. Inline-axis padding gives a peek of the
            neighbouring card so the carousel reads as swipeable.
            `scrollbar-none` (defined in globals.css) hides the bar.
            No GSAP here, so ScrollSmoother's vertical normalizeScroll
            never fights this horizontal scroller.

            ≥ lg (desktop): an overflow-clipped one-card-wide mask. GSAP
            translates `trackRef` on X through Step 1 → 2 → 3. The
            mobile scroll/snap utilities are stripped at lg so they
            don't interfere with the GSAP transform. */}
        <div
          ref={focusRef}
          className="
            w-full
            snap-x snap-mandatory scroll-px-6 overflow-x-auto scrollbar-none
            sm:scroll-px-12
            lg:h-auto lg:w-[clamp(280px,30vw,460px)] lg:max-w-[460px]
            lg:snap-none lg:overflow-hidden lg:scroll-px-0
          "
        >
          <div
            ref={trackRef}
            className="
              flex w-max gap-8 px-6 will-change-transform
              sm:gap-10 sm:px-12
              lg:w-auto lg:gap-[80px] lg:px-0
            "
          >
            {steps.map((s) => (
              <div
                key={s.number}
                className="shrink-0 snap-center snap-always lg:snap-align-none"
              >
                <StepCard {...s} />
              </div>
            ))}
          </div>
        </div>

        {/* Right-column hero composite — desktop only.
            Width fluidly matches the focus viewport / card. At 1024px
            the screen is too narrow to fit two 460px columns + 235px
            paddings, so the hero scales down with viewport width and
            tops out at 460px on wider screens. Aspect 516/833 matches
            the QuoteSection café image. */}
        {/* Hero: vertically centred via `top-1/2` + GSAP `yPercent: -50`
            baseline (set inside useGSAP), then the timeline layers a
            slide-in (xPercent) plus a ±3% parallax (yPercent) on top.
            We don't use Tailwind's `-translate-y-1/2` here because
            GSAP rewrites the transform property and would clobber it
            on the first tween tick. */}
        <div
          ref={heroRef}
          aria-hidden
          className="
            pointer-events-none absolute right-12 top-1/2
            hidden aspect-[516/833] w-[clamp(280px,30vw,460px)]
            overflow-hidden rounded-2xl bg-cloud-300
            lg:right-[clamp(48px,16vw,235px)] lg:block
          "
        >
          <Image
            src="/images/header-bg.jpg"
            alt=""
            fill
            sizes="(min-width: 1280px) 460px, 30vw"
            quality={90}
            className="object-cover object-bottom"
          />
          <div className="absolute inset-x-0 bottom-[8%] flex justify-center px-4">
            <Image
              src="/images/hero-illustration.png"
              alt=""
              width={526}
              height={355}
              sizes="(min-width: 1280px) 360px, 28vw"
              className="h-auto w-[78%]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
