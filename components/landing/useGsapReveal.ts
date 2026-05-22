"use client";

/**
 * useGsapReveal — wires a fade-up reveal to every `[data-reveal]` element
 * inside the given scope. Driven by ScrollTrigger.batch so 30 elements
 * cost one observer, not 30. opacity + y only (transform-safe, no layout).
 *
 * `prefers-reduced-motion: reduce` → instant visible, no tween, no batch.
 *
 * Tuning lives here so subpages just sprinkle the attribute and forget.
 */
import { useEffect, type RefObject } from "react";
import { gsap } from "@/lib/gsap";
import { ScrollTrigger } from "@/lib/gsap-scroll";

interface Options {
  /** y-distance the element rises through (px). Default 18 — small enough to read as breath, not motion. */
  distance?: number;
  /** ms between siblings entering view together. Default 80. */
  staggerMs?: number;
  /** Reveal duration in seconds. Default 0.7. */
  duration?: number;
  /** Where on the viewport the trigger fires. Default "top 85%". */
  start?: string;
}

export function useGsapReveal(
  scopeRef: RefObject<HTMLElement | null>,
  opts: Options = {},
): void {
  const { distance = 18, staggerMs = 80, duration = 0.7, start = "top 85%" } = opts;

  useEffect(() => {
    const root = scopeRef.current;
    if (!root) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const targets = Array.from(
      root.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    if (targets.length === 0) return;

    if (reduced) {
      // Reduced motion: globals.css already shows [data-reveal] at full
      // opacity for this preference, so we just need to undo any
      // transform we might have applied if the preference flipped after
      // mount. Cheap defensive set.
      gsap.set(targets, { opacity: 1, y: 0, clearProps: "transform" });
      return;
    }

    // Initial hidden state is owned by globals.css ([data-reveal]
    // { opacity: 0; transform: translate3d(0, 18px, 0) }). That CSS
    // applies at first paint, before this effect runs, so SSR HTML
    // doesn't flash-then-hide. We sync GSAP's view of the value here
    // (so its tween starts from the right place) without re-setting
    // visibility from scratch.
    gsap.set(targets, { opacity: 0, y: distance });

    const triggers = ScrollTrigger.batch(targets, {
      start,
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration,
          ease: "power2.out",
          stagger: staggerMs / 1000,
          overwrite: "auto",
        });
      },
    });

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, [scopeRef, distance, staggerMs, duration, start]);
}
