"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { StepCard } from "./StepCard";

const steps = [
  {
    number: 1 as const,
    title: "Tell us about your dog.",
    body: "Breed, size, temperament — so recommendations actually make sense for you.",
  },
  {
    number: 2 as const,
    title: "Discover places you'll both love.",
    body: "Parks, cafés, beaches, stays — all vetted, reviewed and accurate.",
  },
  {
    number: 3 as const,
    title: "Walk out the door with confidence.",
    body: "No research. No surprises. Just a good outing.",
  },
];

/**
 * Section 3 — adapts by breakpoint.
 *
 * ≥ lg (desktop):
 *   Pinned horizontal-scroll storytelling. Left column holds the
 *   headline + a one-card-wide focus viewport; right column shows a
 *   portrait hero composite that mirrors the QuoteSection café image
 *   in shape and size. The cards pan through the focus viewport on
 *   scroll (Step 1 → 2 → 3), pinned for 2.5 viewports of scroll, with
 *   ScrollTrigger snap pulling the user onto each settled step.
 *
 * < lg (mobile / tablet):
 *   No pin, no horizontal pan. Headline at the top, three cards
 *   stacked vertically below it, hero composite hidden. The whole
 *   section scrolls vertically like every other section on the page.
 *   Touch users get to scroll naturally instead of having vertical
 *   gestures hijacked into a horizontal animation.
 *
 * Reduced-motion users (any viewport) get the mobile-style stack.
 */
export function StepsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const headline = headlineRef.current;
      const track = trackRef.current;
      const stage = stageRef.current;
      const focus = focusRef.current;
      if (!section || !headline || !track || !stage || !focus) return;

      const desktop = window.matchMedia("(min-width: 1024px)");
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

      // Skip the pinned timeline entirely below lg and for reduced
      // motion — mobile/tablet get a static vertical stack via CSS
      // (see JSX below: `lg:overflow-hidden` etc.). gsap.matchMedia
      // tears down + rebuilds the timeline cleanly on viewport
      // crossings so resizing the window doesn't leave half-state.
      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        },
        (context) => {
          if (!context.conditions?.isDesktop) return;

          // Card N's left edge in track-local coordinates. To align
          // card N inside the focus viewport, translate the track by
          // -card.offsetLeft.
          const cardX = (n: number) => {
            const card = track.children[n] as HTMLElement | undefined;
            return card ? -card.offsetLeft : 0;
          };

          // Track's off-stage starting position — first card is parked
          // just past the right edge of the focus viewport.
          const trackEntryX = () => focus.clientWidth;

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${window.innerHeight * 2.5}`,
              pin: true,
              // Tight scrub — ScrollSmoother already smooths wheel
              // input, so we avoid double easing.
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

          // 0.0 → 0.5 — Headline reveal.
          tl.fromTo(
            headline,
            { xPercent: 30, opacity: 0 },
            { xPercent: 0, opacity: 1, ease: "power2.out", duration: 0.5 }
          );

          // 0.5 → 1.0 — Track enters and lands Step 1.
          tl.fromTo(
            track,
            { x: trackEntryX },
            { x: () => cardX(0), ease: "power2.out", duration: 0.5 }
          );
          tl.addLabel("step-1");
          tl.to({}, { duration: 0.3 });

          // Step 2.
          tl.to(track, {
            x: () => cardX(1),
            ease: "power2.inOut",
            duration: 0.3,
          });
          tl.addLabel("step-2");
          tl.to({}, { duration: 0.3 });

          // Step 3.
          tl.to(track, {
            x: () => cardX(2),
            ease: "power2.inOut",
            duration: 0.3,
          });
          tl.addLabel("step-3");
          tl.to({}, { duration: 0.3 });

          // Recompute once fonts settle in case card widths shift.
          document.fonts?.ready.then(() => ScrollTrigger.refresh());
        }
      );

      // Below lg, ensure no leftover inline transforms / opacity from
      // a prior desktop mount sneak through (matchMedia cleanup
      // already reverts most of it, but `xPercent` on the headline
      // can persist if the user crosses the breakpoint mid-animation).
      mm.add("(max-width: 1023px)", () => {
        gsap.set([headline, track], { clearProps: "all" });
      });

      void desktop;
      void reduced;
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

        {/* Card track.
            • lg+ : one-card-wide focus viewport (lg:w-[460px]), GSAP
                    pans the track horizontally through it
                    (overflow-hidden clips off-stage cards).
            • < lg: focus viewport is full-width, track switches to a
                    vertical column so the three cards stack and the
                    user just scrolls past them. */}
        <div
          ref={focusRef}
          className="
            w-full lg:overflow-hidden
            lg:w-[clamp(280px,30vw,460px)] lg:max-w-[460px]
          "
        >
          <div
            ref={trackRef}
            className="
              flex flex-col gap-8 sm:gap-10
              lg:flex-row lg:gap-[80px] lg:will-change-transform
            "
          >
            {steps.map((s) => (
              <StepCard key={s.number} {...s} />
            ))}
          </div>
        </div>

        {/* Right-column hero composite — desktop only.
            Width fluidly matches the focus viewport / card. At 1024px
            the screen is too narrow to fit two 460px columns + 235px
            paddings, so the hero scales down with viewport width and
            tops out at 460px on wider screens. Aspect 516/833 matches
            the QuoteSection café image. */}
        <div
          aria-hidden
          className="
            pointer-events-none absolute right-12 top-1/2
            hidden aspect-[516/833] w-[clamp(280px,30vw,460px)]
            -translate-y-1/2 overflow-hidden rounded-2xl bg-cloud-300
            lg:right-[clamp(48px,16vw,235px)] lg:block
          "
        >
          <Image
            src="/images/header-bg.jpg"
            alt=""
            fill
            sizes="(min-width: 1280px) 516px, 460px"
            quality={90}
            className="object-cover object-bottom"
          />
          <div className="absolute inset-x-0 bottom-[8%] flex justify-center px-4">
            <Image
              src="/images/hero-illustration.png"
              alt=""
              width={526}
              height={355}
              sizes="(min-width: 1280px) 400px, 360px"
              className="h-auto w-[78%]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
