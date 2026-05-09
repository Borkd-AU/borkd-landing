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
 * Behaviour (every viewport, including mobile):
 *   1. As the section enters the viewport, the headline slides in from
 *      RIGHT to left and locks at its final position.
 *   2. With the section pinned, the 3-step track also slides in from the
 *      right as the user continues scrolling vertically.
 *
 * Users with `prefers-reduced-motion: reduce` see a static swipe-able
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

      // Reduced-motion users get the static fallback track.
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (reduced) {
        gsap.set([headline, track], { clearProps: "all" });
        return;
      }

      // How far the track needs to slide so its right edge aligns with
      // the stage's right edge. Recomputed on every refresh so font and
      // image loads can adjust the pin distance without rebuilding.
      const overflow = () =>
        Math.max(0, track.scrollWidth - stage.clientWidth);

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

      // Headline: slide in from the RIGHT edge of the stage.
      tl.fromTo(
        headline,
        { xPercent: 110, opacity: 0 },
        { xPercent: 0, opacity: 1, ease: "power2.out", duration: 1 }
      );
      // Track: enter from the right, then pan left until the last card
      // is fully visible at the stage's right edge — i.e. final x = -overflow().
      tl.fromTo(
        track,
        { x: () => stage.clientWidth },
        { x: () => -overflow(), ease: "none", duration: 2 },
        ">"
      );

      // Refresh once layout is final so the pin distance is accurate.
      ScrollTrigger.refresh();
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
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
        className="relative mx-auto flex h-screen max-w-[1440px] flex-col justify-center gap-10 overflow-hidden px-6 sm:gap-12 sm:px-12 lg:gap-20 lg:px-[235px]"
      >
        <h2
          ref={headlineRef}
          className="max-w-[1168px] leading-tight tracking-tight text-content-brand text-[clamp(28px,5vw,50px)]"
          style={{ fontVariationSettings: "'opsz' 14" }}
        >
          Think Google Maps, but made for{" "}
          <em className="font-display italic">
            your dog&rsquo;s unique needs.
          </em>
        </h2>

        <div
          ref={trackRef}
          className="flex gap-6 will-change-transform sm:gap-12 lg:gap-[80px]"
        >
          {steps.map((s) => (
            <StepCard key={s.number} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}
