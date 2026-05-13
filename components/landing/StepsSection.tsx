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

  useGSAP(
    () => {
      const section = sectionRef.current;
      const headline = headlineRef.current;
      const track = trackRef.current;
      const stage = stageRef.current;
      const focus = focusRef.current;
      if (!section || !headline || !track || !stage || !focus) return;

      const mm = gsap.matchMedia();

      // Reduced-motion fallback (any viewport): no pin, no animation.
      // The CSS layout (flex-col below lg, flex-row at lg+) already
      // shows all three cards so a static stack is perfectly readable.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([headline, track], { clearProps: "all" });
      });

      // Shared timeline factory — wires up snap + per-card holds.
      // axis is "x" on desktop, "y" on mobile/tablet.
      const buildTimeline = (axis: "x" | "y") => {
        const offsetForCard = (n: number) => {
          const card = track.children[n] as HTMLElement | undefined;
          if (!card) return 0;
          return axis === "x" ? -card.offsetLeft : -card.offsetTop;
        };
        const trackEntry = () =>
          axis === "x" ? focus.clientWidth : focus.clientHeight;

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

        // Headline reveal (uses xPercent on desktop, yPercent on mobile
        // so the slide-in direction matches the card pan).
        tl.fromTo(
          headline,
          axis === "x"
            ? { xPercent: 30, opacity: 0 }
            : { yPercent: 30, opacity: 0 },
          {
            xPercent: 0,
            yPercent: 0,
            opacity: 1,
            ease: "power2.out",
            duration: 0.5,
          }
        );

        // Track enters from off-stage and lands Step 1.
        tl.fromTo(
          track,
          { [axis]: trackEntry },
          {
            [axis]: () => offsetForCard(0),
            ease: "power2.out",
            duration: 0.5,
          }
        );
        tl.addLabel("step-1");
        tl.to({}, { duration: 0.3 });

        // Step 2.
        tl.to(track, {
          [axis]: () => offsetForCard(1),
          ease: "power2.inOut",
          duration: 0.3,
        });
        tl.addLabel("step-2");
        tl.to({}, { duration: 0.3 });

        // Step 3.
        tl.to(track, {
          [axis]: () => offsetForCard(2),
          ease: "power2.inOut",
          duration: 0.3,
        });
        tl.addLabel("step-3");
        tl.to({}, { duration: 0.3 });
      };

      // Desktop branch — horizontal pan.
      mm.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          buildTimeline("x");
          document.fonts?.ready.then(() => ScrollTrigger.refresh());
        }
      );

      // Mobile / tablet branch — vertical pan.
      mm.add(
        "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
        () => {
          buildTimeline("y");
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

        {/* Focus viewport — masks the track so only one card is ever
            visible. On lg+ it's one card wide (overflow-x clipped);
            below lg it's one card tall (overflow-y clipped). The track
            inside slides on the corresponding axis.
            min-h on mobile gives the focus area a tall-enough mask
            that the card breathes — tied to the same clamp the stage
            uses so cards aren't squished on short viewports. */}
        <div
          ref={focusRef}
          className="
            w-full overflow-hidden
            h-[clamp(180px,28vh,240px)]
            lg:h-auto
            lg:w-[clamp(280px,30vw,460px)] lg:max-w-[460px]
          "
        >
          <div
            ref={trackRef}
            className="
              flex flex-col gap-8 will-change-transform
              sm:gap-10
              lg:flex-row lg:gap-[80px]
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
