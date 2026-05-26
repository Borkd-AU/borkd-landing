"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { useGSAP } from "@/lib/gsap-react";
import { ScrollSmoother, ScrollTrigger } from "@/lib/gsap-scroll";

/**
 * Page-wide momentum/easing powered by GSAP's own ScrollSmoother —
 * the same lib gsap.com uses on its marketing site. ScrollSmoother
 * works with ScrollTrigger out of the box (single RAF loop, perfect
 * pin sync).
 *
 * Requires the layout to wrap children in:
 *   <div id="smooth-wrapper">
 *     <div id="smooth-content">{children}</div>
 *   </div>
 *
 * Enabled on EVERY viewport, motion-allowed. Originally desktop-gated
 * because StepsSection mobile was a native CSS scroll-snap row and the
 * smoother's touch-action mutations broke that. StepsSection mobile is
 * now also a GSAP pin/scrub/snap timeline, so the original conflict no
 * longer applies and we route all touch scroll through GSAP for one
 * consistent feel.
 *
 * Mobile-specific knobs:
 *   • smoothTouch: 0.1 — short catch-up on touch devices (default 0 = no
 *     mobile smoothing). 0.1s feels tight; longer values get laggy under
 *     iOS native momentum.
 *   • ignoreMobileResize: true — forwarded into ScrollTrigger.config so
 *     address-bar show/hide on iOS portrait doesn't trigger a refresh.
 *     That refresh was the source of intermittent jitter in the
 *     StepsSection pinned timeline (startDelta recomputed mid-scroll).
 *
 * Skipped for `prefers-reduced-motion: reduce` — those users keep
 * native browser scrolling on every viewport.
 */
// ScrollSmoother runs on every page, motion-allowed. Subpages don't
// benefit much from the smoothing itself, but global activation keeps
// page-to-page scroll feel consistent. Anything that hand-rolls
// element-position math (e.g. ReadingShell's TOC tracking) must read
// coords via the smoother's API instead of getBoundingClientRect — see
// ReadingShell.tsx for the pattern.
export function SmoothScroll() {
  const pathname = usePathname();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        ScrollSmoother.create({
          wrapper: "#smooth-wrapper",
          content: "#smooth-content",
          // 1.0 ≈ tight, gsap.com-style. Higher = floatier.
          smooth: 1.0,
          // Mobile touch smoothing — short catch-up so the pinned
          // horizontal pan in StepsSection rides the same RAF loop as
          // desktop. 0 (the old value) left mobile on native momentum,
          // which fought the GSAP timeline's scrub.
          smoothTouch: 0.1,
          // Parse data-speed / data-lag attributes for parallax effects.
          effects: true,
          // Quiets scroll-jank from address-bar resize and similar.
          // Combined with ignoreMobileResize below this stops iOS
          // address-bar toggles from refreshing ScrollTrigger geometry.
          normalizeScroll: true,
          // Forwarded into ScrollTrigger.config(). Prevents the
          // address-bar resize jump on iOS portrait — fixes the
          // intermittent jitter in StepsSection's pinned timeline.
          ignoreMobileResize: true,
        });

        // Child useGSAP hooks ran first (React effects fire bottom-up);
        // their triggers were registered against window scroll. Re-measure
        // them now that the smoother is wrapping the page.
        ScrollTrigger.refresh();

        // matchMedia cleanup: kill the smoother when reduced-motion is
        // toggled on so its touch-action mutations don't strand users.
        return () => {
          ScrollSmoother.get()?.kill();
        };
      });
    },
  );

  // ScrollSmoother owns scroll position via transforms on #smooth-content,
  // so Next's default scroll-restoration-on-nav doesn't reach it. Snap to
  // the top on every pathname change.
  useEffect(() => {
    const smoother = ScrollSmoother.get();
    if (smoother) {
      smoother.scrollTop(0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
