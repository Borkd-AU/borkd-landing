"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Page-wide momentum/easing for wheel + touchpad input, integrated
 * with GSAP ScrollTrigger so pinned timelines (StepsSection) stay in
 * sync with Lenis's virtual scroll position.
 *
 * Skipped entirely for `prefers-reduced-motion: reduce` — those users
 * keep native browser scrolling.
 *
 * Mounts at the root layout, owns a single Lenis instance for the
 * lifetime of the page, and tears it down on unmount so React hot
 * reloads don't leak listeners.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const lenis = new Lenis({
      // Smaller numbers = closer to native, larger = floatier.
      lerp: 0.1,
      // Mouse wheel multiplier — Lenis defaults read fine on macOS
      // trackpads; keep wheelMultiplier tame so a single notch doesn't
      // scroll a viewport+.
      wheelMultiplier: 1,
      // Allow native touch scroll on mobile so iOS Safari momentum
      // and pull-to-refresh keep working. Lenis still smooths wheel
      // and trackpad input on desktop.
      smoothWheel: true,
      syncTouch: false,
    });

    // Drive Lenis from GSAP's ticker so all RAF work happens in one
    // loop and ScrollTrigger updates land on the same frame as the
    // virtual scroll position.
    const raf = (time: number) => {
      // GSAP ticker reports time in seconds; Lenis wants ms.
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Whenever Lenis moves the page, tell ScrollTrigger to re-evaluate
    // its triggers and progress.
    lenis.on("scroll", ScrollTrigger.update);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
