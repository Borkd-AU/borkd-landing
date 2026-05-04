"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { StepCard } from "./StepCard";

gsap.registerPlugin(ScrollTrigger, useGSAP);

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
 * Section 3 — Horizontal-scroll storytelling.
 *
 * Behaviour matches the Figma annotations:
 *   1. As the section enters the viewport, the headline slides in from
 *      left to right and locks at its final position.
 *   2. With the section pinned, the 3-step track scrolls horizontally as
 *      the user continues scrolling vertically.
 *
 * On touch devices we fall back to a CSS scroll-snap track so users can
 * swipe through steps naturally instead of hijacking the page scroll.
 *
 * Users with `prefers-reduced-motion: reduce` see the same swipe-able
 * track without any pinning or scroll-driven animation.
 */
export function StepsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const headline = headlineRef.current;
      const track = trackRef.current;
      const stage = stageRef.current;
      if (!section || !headline || !track || !stage) return;

      // Skip the GSAP-pinned timeline on small viewports and on
      // prefers-reduced-motion. CSS scroll-snap takes over instead.
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (!desktop || reduced) return;

      // How far the track needs to slide so its right edge aligns with
      // the stage's right edge. Recomputed on every refresh so font and
      // image loads can adjust the pin distance without rebuilding.
      const overflow = () =>
        Math.max(0, track.scrollWidth - stage.clientWidth);

      // Initial state — headline off-screen left, track at origin.
      gsap.set(headline, { xPercent: -110, opacity: 0 });
      gsap.set(track, { x: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${overflow() + window.innerHeight}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to(headline, {
        xPercent: 0,
        opacity: 1,
        ease: "power2.out",
        duration: 1,
      });
      tl.to(
        track,
        { x: () => -overflow(), ease: "none", duration: 2 },
        ">"
      );

      // Refresh after fonts settle so widths are accurate.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="steps"
      className="relative w-full bg-background-brand py-16 lg:py-0"
    >
      <div
        ref={stageRef}
        className="relative mx-auto flex max-w-[1440px] flex-col gap-12 overflow-hidden px-6 sm:px-12 md:px-[235px] lg:h-screen lg:justify-center lg:gap-20"
      >
        <h2
          ref={headlineRef}
          className="max-w-[1168px] text-[32px] leading-tight tracking-tight text-content-brand sm:text-[42px] lg:text-[50px]"
          style={{ fontVariationSettings: "'opsz' 14" }}
        >
          Think Google Maps, but made for{" "}
          <em className="font-display italic">
            your dog&rsquo;s unique needs.
          </em>
        </h2>

        <div
          ref={trackRef}
          className="
            flex gap-10 sm:gap-[80px]
            overflow-x-auto scroll-smooth pb-4
            snap-x snap-mandatory
            [-ms-overflow-style:none] [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
            lg:overflow-visible lg:pb-0 lg:will-change-transform
          "
        >
          {steps.map((s) => (
            <div key={s.number} className="snap-center lg:snap-none">
              <StepCard {...s} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
