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
 *   2. With the section pinned, the 3-step track slides in from the
 *      right and snaps each step to the centre of the stage in turn:
 *      Step 1 → Step 2 → Step 3 are each held at the centre before the
 *      next one comes through.
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

      // Returns the track x-translation required to centre the n-th
      // card (0-indexed) inside the stage. Measurements use the
      // untransformed offset* properties so any GSAP transform already
      // applied to the track doesn't affect the calculation.
      //
      //   stageVisualCentre  = midpoint of stage box, viewport-x
      //   trackOriginX       = track's left edge when no transform,
      //                        viewport-x — this equals stage's left
      //                        plus its left padding
      //   cardCentreInTrack  = card.offsetLeft + card.offsetWidth/2
      //                        (relative to track's content box)
      //
      //   final card centre = trackOriginX + cardCentreInTrack + x
      //   solving for x to land at stageVisualCentre:
      //     x = stageVisualCentre - trackOriginX - cardCentreInTrack
      const cardCount = track.children.length;
      const centerXFor = (n: number) => {
        const card = track.children[n] as HTMLElement | undefined;
        if (!card) return 0;
        const stageRect = stage.getBoundingClientRect();
        const stageVisualCentre = stageRect.left + stageRect.width / 2;
        const trackRect = track.getBoundingClientRect();
        // Compensate for the transform currently on the track so we
        // recover the untransformed origin x.
        const currentX = gsap.getProperty(track, "x") as number;
        const trackOriginX = trackRect.left - currentX;
        const cardCentreInTrack =
          card.offsetLeft + card.offsetWidth / 2;
        return stageVisualCentre - trackOriginX - cardCentreInTrack;
      };

      // Total scroll distance: one screenful for the headline + one
      // screenful per card (so each card has time to rest at centre).
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () =>
            `+=${window.innerHeight + cardCount * window.innerHeight}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // 1. Headline slides in from the right.
      tl.fromTo(
        headline,
        { xPercent: 110, opacity: 0 },
        { xPercent: 0, opacity: 1, ease: "power2.out", duration: 1 }
      );

      // 2. Track enters from the right, parked just off the stage's
      //    right edge, then pans through each card to the centre.
      tl.fromTo(
        track,
        { x: () => stage.clientWidth },
        { x: () => centerXFor(0), ease: "power2.out", duration: 1.2 },
        ">"
      );
      // 3. Pan to each subsequent card in turn.
      for (let i = 1; i < cardCount; i++) {
        tl.to(
          track,
          { x: () => centerXFor(i), ease: "power1.inOut", duration: 1 },
          ">"
        );
      }

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
