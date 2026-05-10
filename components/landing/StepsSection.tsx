"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { StepCard, STEP_CARD_WIDTH_CLASSES } from "./StepCard";

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
 * Layout:
 *   stage (h-screen, pinned)
 *     headline (left-aligned, slides in)
 *     focus viewport (one card wide, overflow-hidden)
 *       track (flex row of cards) ← x animated by GSAP
 *
 * The focus viewport is exactly one card wide, so when the track
 * left-aligns a card to it, the previous and next cards are visually
 * masked off. That is the "one beat at a time" feel — you only see
 * the active step.
 *
 * Scroll choreography (each "unit" = one viewport of pinned scroll):
 *   0.0 → 0.5  Headline fade + slide-in
 *   0.5 → 1.0  Track enters from off-right, lands Step 1
 *   1.0 → 1.3  Hold on Step 1
 *   1.3 → 1.6  Pan to Step 2
 *   1.6 → 1.9  Hold on Step 2
 *   1.9 → 2.2  Pan to Step 3
 *   2.2 → 2.5  Hold on Step 3 (so unpin happens with Step 3 settled)
 *
 * Total pin distance = 2.5 viewports.
 *
 * ScrollTrigger snap pulls the user to the nearest "step settled"
 * label when scrolling stops, so a slow flick lands cleanly on a
 * beat instead of mid-pan.
 *
 * Reduced-motion users skip the whole interaction.
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

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (reduced) {
        gsap.set([headline, track], { clearProps: "all" });
        return;
      }

      // Card N's left edge in track-local coordinates. To align card
      // N inside the focus viewport, translate the track by
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
          // Tight scrub — gsap.com-style "almost direct, just smoothed."
          // ScrollSmoother is already smoothing the wheel input, so we
          // keep this minimal to avoid double-easing.
          scrub: 0.1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: {
            // labelsDirectional only snaps in the direction the user
            // is already scrolling — so a slow flick forward never
            // pulls them back to the previous step.
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

      // 1.0 — Step 1 settled. Snap target.
      tl.addLabel("step-1");

      // 1.0 → 1.3 — Hold Step 1.
      tl.to({}, { duration: 0.3 });

      // 1.3 → 1.6 — Pan to Step 2.
      tl.to(track, {
        x: () => cardX(1),
        ease: "power2.inOut",
        duration: 0.3,
      });

      // 1.6 — Step 2 settled.
      tl.addLabel("step-2");

      // 1.6 → 1.9 — Hold Step 2.
      tl.to({}, { duration: 0.3 });

      // 1.9 → 2.2 — Pan to Step 3.
      tl.to(track, {
        x: () => cardX(2),
        ease: "power2.inOut",
        duration: 0.3,
      });

      // 2.2 — Step 3 settled.
      tl.addLabel("step-3");

      // 2.2 → 2.5 — Final hold so unpin happens with Step 3 settled.
      tl.to({}, { duration: 0.3 });

      // Recompute once fonts settle in case card widths shift.
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
        className="relative mx-auto flex min-h-[clamp(540px,68vh,760px)] max-w-[1440px] flex-col justify-center gap-8 px-6 py-[clamp(48px,10vh,120px)] sm:gap-10 sm:px-12 lg:gap-12 lg:px-[235px]"
      >
        <h2
          ref={headlineRef}
          className="max-w-[1168px] leading-tight tracking-tight text-content-brand text-[clamp(28px,5vw,50px)] lg:max-w-[820px]"
          style={{ fontVariationSettings: "'opsz' 14" }}
        >
          Think Google Maps, but made for{" "}
          <em className="font-display italic">
            your dog&rsquo;s unique needs.
          </em>
        </h2>

        {/* Focus viewport — exactly one card wide, clipped. The track
            slides through it, so only the active card is visible. The
            width classes are imported from StepCard so the mask and
            card always stay in sync. */}
        <div
          ref={focusRef}
          className={`overflow-hidden ${STEP_CARD_WIDTH_CLASSES}`}
        >
          <div
            ref={trackRef}
            className="flex gap-6 will-change-transform sm:gap-12 lg:gap-[80px]"
          >
            {steps.map((s) => (
              <StepCard key={s.number} {...s} />
            ))}
          </div>
        </div>

        {/* Right-column hero composite — desktop only.
            The pinned stage's left column holds the headline + cards,
            so the right-hand area is empty space. Drop the unused
            first-option hero (sky/field background + man+jojo
            illustration) in there as a vertical composite that mirrors
            the QuoteSection café image's shape, so the page reads as
            "left text + right image" both here and in the about
            section above. Hidden below lg because the pinned timeline
            already uses the full width on smaller viewports. */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-[6%] top-1/2 hidden aspect-[516/833] w-[clamp(220px,18vw,300px)] -translate-y-1/2 overflow-hidden rounded-2xl bg-cloud-300 lg:block"
        >
          <Image
            src="/images/header-bg.jpg"
            alt=""
            fill
            sizes="300px"
            quality={90}
            className="object-cover object-bottom"
          />
          <div className="absolute inset-x-0 bottom-[8%] flex justify-center px-3">
            <Image
              src="/images/hero-illustration.png"
              alt=""
              width={526}
              height={355}
              sizes="240px"
              className="h-auto w-[78%]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
