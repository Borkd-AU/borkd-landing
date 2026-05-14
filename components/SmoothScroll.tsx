"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
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
 * Skipped for `prefers-reduced-motion: reduce` — those users keep
 * native browser scrolling.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useGSAP(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

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
  });

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
