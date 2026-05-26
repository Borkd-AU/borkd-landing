"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useGSAP } from "@/lib/gsap-react";
import { ScrollTrigger } from "@/lib/gsap-scroll";
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
 * Section 3 — pinned scroll storytelling. Same interaction on every
 * viewport: the section pins, vertical scroll drives a HORIZONTAL pan
 * of the card track (Step 1 → 2 → 3), with a headline slide-in beat.
 *
 * ≥ lg (desktop): the focus viewport is one card wide and a hero
 *   composite sits in the right column (slide-in + parallax).
 *
 * < lg (mobile / tablet): identical pin + horizontal pan, just no
 *   hero composite (hidden below lg). ScrollTrigger drives the pin on
 *   native touch scroll — ScrollSmoother is desktop-gated, so
 *   normalizeScroll never touches mobile.
 *
 * Both:
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

      // Reduced-motion (any viewport): no pin, no animation. The static
      // card layout (flex-col below lg, flex-row at lg) is readable as-is.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([headline, track], { clearProps: "all" });
      });

      // Shared pinned horizontal-pan timeline. `withHero` is true only
      // on desktop, where the right-column composite slides in + drifts.
      //
      // `startOffsetEl` is the element whose top decides when the pin
      // engages:
      //   • desktop: the section itself — pin starts when sectionTop
      //     reaches viewportTop ("top top"), which on lg lines up with
      //     content-top thanks to the stage's 100svh min-h + justify-
      //     center.
      //   • mobile: the focus viewport (card-slider mask). The mobile
      //     stage is taller than the viewport (image + headline +
      //     slider), so pinning at sectionTop would push the slider
      //     off the bottom of the fold (user reported this). Use the
      //     slider's offset within the section as the start delta so
      //     pin only fires once the slider has scrolled to viewportTop
      //     — the image + headline pass naturally above the fold, and
      //     the X card pan plays in plain view. The section itself is
      //     still the pin target so the pin spacer's flex layout stays
      //     intact (pinning the flex child directly breaks layout).
      const buildTimeline = (withHero: boolean, startOffsetEl: Element) => {
        const hero = withHero ? heroRef.current : null;
        // Hero baseline transform — vertically centre the absolutely
        // -positioned hero before the timeline takes over. Replaces
        // Tailwind's `-translate-y-1/2` which GSAP would otherwise
        // clobber on the first tween tick.
        if (hero) gsap.set(hero, { yPercent: -50 });

        const offsetForCard = (n: number) => {
          const card = track.children[n] as HTMLElement | undefined;
          return card ? -card.offsetLeft : 0;
        };

        // Distance from section top down to where pin should engage.
        // On desktop startOffsetEl === section, so this is 0 ("top top").
        // On mobile it's the slider's offset below the section top,
        // minus a viewport-relative offset so the headline above the
        // slider stays in view when pin starts (slider lands ~45% down
        // the viewport, not at the very top).
        //
        // Floor (mobile only): the hero card must have fully scrolled
        // past the viewport top before pin engages. Previously we only
        // accounted for headline room; the tall hero card above the
        // headline ended up frozen partially in-frame during pin (user
        // reported the bottom of the hero image clipped at viewport
        // bottom). Reading the hero's own bottom edge ties the pin
        // start to the actual visual flow, so shrinking or resizing
        // the hero doesn't reintroduce the trap.
        const startDelta = () => {
          if (startOffsetEl === section) return 0;
          const sectionRect = section.getBoundingClientRect();
          const startRect = startOffsetEl.getBoundingClientRect();
          const raw = Math.round(startRect.top - sectionRect.top);
          const headlineRoom = Math.round(window.innerHeight * 0.45);
          const sliderBased = Math.max(0, raw - headlineRoom);

          const heroEl = section.querySelector<HTMLElement>(
            "[data-hero-mobile]"
          );
          if (!heroEl) return sliderBased;
          const heroRect = heroEl.getBoundingClientRect();
          // heroBottom relative to section top — at this scroll
          // distance the hero card's bottom edge is at viewport top.
          const heroBottom = Math.round(
            heroRect.bottom - sectionRect.top
          );
          return Math.max(sliderBased, heroBottom);
        };

        // Snap: tighter on mobile so it doesn't fight ScrollSmoother's
        // touch catch-up (smoothTouch 0.1) after a fling. Desktop keeps
        // the original feel — it never had the momentum-vs-snap fight
        // because desktop scroll is wheel-driven and the previous
        // 0.2–0.5s/0.05s delay timing already felt right there.
        const snap = withHero
          ? {
              snapTo: "labelsDirectional" as const,
              duration: { min: 0.2, max: 0.5 },
              delay: 0.05,
              ease: "power2.inOut",
            }
          : {
              snapTo: "labelsDirectional" as const,
              duration: { min: 0.1, max: 0.25 },
              delay: 0,
              ease: "power2.inOut",
            };

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: () => `top top-=${startDelta()}`,
            end: () => `+=${window.innerHeight * 2.5}`,
            pin: true,
            scrub: 0.1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            snap,
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
        // duration — yPercent drifts ±1% around the -50 baseline so it
        // never looks frozen while the cards are panning. Previously
        // ±3%, but on short viewports (1366×768 laptops) that drift
        // pushed the card bottom past the pinned viewport edge.
        if (hero) {
          tl.fromTo(
            hero,
            { yPercent: -51 },
            { yPercent: -49, ease: "none", duration: 2.5 },
            0
          );
        }

        document.fonts?.ready.then(() => ScrollTrigger.refresh());
      };

      // Desktop — pin the section from its very top (startOffsetEl ===
      // section means startDelta === 0, i.e. "top top"). At lg the
      // stage fits 100svh + centers so this lines up with content-top.
      mm.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => buildTimeline(true, section)
      );

      // Mobile / tablet — pin the section, but delay the start until
      // the card slider (focus) has scrolled up to the viewport top.
      // The image + headline pass naturally as a section header; the
      // slider locks in plain view while the X card pan plays.
      mm.add(
        "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
        () => buildTimeline(false, focus)
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="steps"
      // overflow-hidden contains the GSAP-translated card track inside
      // the section. focus has overflow:hidden so the *visual* clip
      // works, but a transformed descendant's bounding box still
      // extends out (track right ≈ 1.4k on a 390px phone), which
      // leaks into body.scrollWidth and causes the whole page to
      // scroll horizontally on mobile (and throws off the hero
      // layout above the fold). Clipping at the section boundary
      // stops the leak without touching the desktop hero composite
      // (already inside the stage's max-w container).
      className="relative w-full overflow-hidden bg-background-brand"
    >
      <div
        ref={stageRef}
        className="
          relative mx-auto flex max-w-[1440px] flex-col
          gap-8 px-6
          py-[clamp(48px,10vh,120px)]
          sm:gap-10 sm:px-12
          lg:min-h-[clamp(720px,80vh,840px)] lg:justify-center lg:gap-12
          lg:px-[clamp(48px,16vw,235px)]
        "
      >
        {/* Mobile-only hero composite — mirrors the desktop right-column
            card so phones don't miss the field/man+jojo visual. Sized
            to match the QuoteSection card above for visual consistency
            (same aspect, same max-w clamps). Positioned ABOVE the
            headline on mobile so it leads the section visually; the
            desktop instance further down stays absolute-positioned in
            the right column and is GSAP-driven. This static mobile
            twin has no GSAP attached so it never fights the timeline.
            Because it's now full-width, the mobile stage drops its
            100svh min-h so the content flows to its natural height;
            GSAP pin still channels vertical scroll into the X card
            pan, the visible window into the pin is just taller now.
            aria-hidden because the desktop instance carries the same
            (empty) alt and there's no information lost to AT. */}
        <div
          aria-hidden
          data-hero-mobile
          className="
            relative mx-auto aspect-[516/833] w-full max-w-[420px]
            shrink-0 overflow-hidden rounded-2xl bg-cloud-300
            sm:max-w-[460px]
            lg:hidden
          "
        >
          <Image
            src="/images/header-bg.jpg"
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1023px) 460px, 0px"
            quality={85}
            className="object-cover object-bottom"
          />
          <div className="absolute inset-x-0 bottom-[8%] flex justify-center px-4">
            <Image
              src="/images/hero-illustration.png"
              alt=""
              width={526}
              height={355}
              sizes="(max-width: 640px) 78vw, (max-width: 1023px) 360px, 0px"
              className="h-auto w-[78%]"
            />
          </div>
        </div>

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

        {/* Focus viewport — an overflow-clipped one-card-wide mask on
            every viewport. GSAP translates `trackRef` on X through
            Step 1 → 2 → 3 while the section is pinned. Full-width on
            mobile (card is ~82vw so the slide is visible); fixed
            card-width column on desktop alongside the hero. */}
        <div
          ref={focusRef}
          className="
            w-full overflow-hidden
            lg:w-[clamp(280px,30vw,460px)] lg:max-w-[460px]
          "
        >
          <div
            ref={trackRef}
            className="
              flex gap-8 will-change-transform
              sm:gap-10
              lg:gap-[80px]
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
            the QuoteSection café image.

            Width is capped by a 80svh height budget converted into a
            width via the 516/833 aspect ratio: 80svh × (516/833) ≈
            49.5svh. min() picks the smaller of viewport-width-based
            clamp() and the height-budget cap, so on short viewports
            (e.g. 1366×768 laptops) the card shrinks proportionally
            instead of overflowing the stage and clipping below the
            viewport during pin. Using max-h alone would clamp height
            with width fixed, breaking the portrait aspect. */}
        {/* Hero: vertically centred via `top-1/2` + GSAP `yPercent: -50`
            baseline (set inside useGSAP), then the timeline layers a
            slide-in (xPercent) plus a ±1% parallax (yPercent) on top.
            Parallax was ±3% but on short viewports that 3% drift was
            enough to push the card edge past the pinned viewport.
            We don't use Tailwind's `-translate-y-1/2` here because
            GSAP rewrites the transform property and would clobber it
            on the first tween tick. */}
        <div
          ref={heroRef}
          aria-hidden
          className="
            pointer-events-none absolute right-12 top-1/2
            hidden aspect-[516/833] w-[min(clamp(280px,30vw,460px),49.5svh)]
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
