"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  gsap,
  useGSAP,
  ScrollSmoother,
  ScrollTrigger,
} from "@/lib/gsap";

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
 * DESKTOP ONLY (>= lg / 1024px). ScrollSmoother is created with
 * `normalizeScroll: true`, which sets an inline `touch-action: pan-x`
 * lock on <body>/<html> and intercepts touch input at the document
 * level. On phones that lock fights — and breaks — the native vertical
 * page scroll *and* the horizontal swipe carousel in StepsSection
 * (which below lg is a plain CSS scroll-snap container, no GSAP). So
 * the smoother is gated behind the same 1024px breakpoint StepsSection
 * uses: desktop gets the pinned horizontal pan that needs it, mobile
 * keeps untouched native scrolling. `gsap.matchMedia` auto-reverts the
 * smoother (and its touch-action mutations) when the viewport crosses
 * the breakpoint, so nothing leaks across.
 *
 * Skipped for `prefers-reduced-motion: reduce` — those users keep
 * native browser scrolling on every viewport.
 */
// ScrollSmoother runs on every page (desktop, motion-allowed). Subpages
// don't benefit much from the smoothing itself, but global activation
// keeps page-to-page scroll feel consistent. Anything that hand-rolls
// element-position math (e.g. ReadingShell's TOC tracking) must read
// coords via the smoother's API instead of getBoundingClientRect — see
// ReadingShell.tsx for the pattern.
export function SmoothScroll() {
  const pathname = usePathname();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          ScrollSmoother.create({
            wrapper: "#smooth-wrapper",
            content: "#smooth-content",
            // 1.0 ≈ tight, gsap.com-style. Higher = floatier.
            smooth: 1.0,
            // iOS Safari momentum scroll is excellent on its own; smoothing
            // touch input on top can feel laggy.
            smoothTouch: 0,
            // Parse data-speed / data-lag attributes for parallax effects.
            effects: true,
            // Quiets scroll-jank from address-bar resize and similar.
            normalizeScroll: true,
          });

          // Child useGSAP hooks ran first (React effects fire bottom-up);
          // their triggers were registered against window scroll. Re-measure
          // them now that the smoother is wrapping the page.
          ScrollTrigger.refresh();

          // matchMedia cleanup: kill the smoother when we drop below lg so
          // its normalizeScroll touch-action mutations don't strand mobile.
          return () => {
            ScrollSmoother.get()?.kill();
          };
        }
      );
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
