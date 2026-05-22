"use client";

/**
 * RevealHeading — wraps a heading element and reveals its characters with
 * a small stagger on mount. Uses GSAP's SplitText (already registered in
 * lib/gsap), so the markup the user sees in the DOM is the original text
 * — SplitText injects per-char spans only at runtime.
 *
 * `prefers-reduced-motion: reduce` → no split, no tween. Content paints
 * normally with no FOUC.
 *
 * Tag is configurable so callers keep semantic heading levels (h1 on
 * page hero, h2 on section header, etc.) without losing the effect.
 */
import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { SplitText } from "@/lib/gsap-split";

interface Props {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Per-character stagger in ms. Default 24 — fast enough to feel like one motion. */
  staggerMs?: number;
  /** Distance each char rises through (px). Default 14. */
  distance?: number;
  /** Delay before the reveal starts in seconds. Default 0.05 — lets the layout settle. */
  delay?: number;
}

export function RevealHeading({
  as: Tag = "h1",
  children,
  className,
  staggerMs = 24,
  distance = 14,
  delay = 0.05,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // Reduced motion: clear the SSR visibility:hidden so content
      // paints normally with no animation.
      el.style.visibility = "";
      return;
    }

    let split: InstanceType<typeof SplitText> | null = null;
    let charTween: gsap.core.Tween | null = null;
    let cancelled = false;
    // Defer one frame so layout (fonts, line-wrapping) settles before split.
    // Without this, SplitText can split on a pre-font-load layout and the
    // chars jump when the web font finally arrives.
    //
    // Split both `chars` AND `words`. Char-only splits set each character
    // to display:inline-block, which breaks the browser's normal word-
    // wrapping ("line." would wrap mid-word as "lin / e."). Word splits
    // wrap each word in its own inline-block so wrap stays atomic.
    const run = () => {
      if (cancelled || !ref.current) return;
      try {
        split = new SplitText(el, {
          type: "chars,words",
          charsClass: "reveal-char",
          wordsClass: "reveal-word",
        });
        gsap.set(split.chars, { yPercent: (distance / 14) * 100, opacity: 0 });
        // Reveal the (now-split) element only after the layout work is
        // committed, so the user never sees the un-split text or a blank
        // frame between the visibility flip and the first char tween.
        el.style.visibility = "";
        // Retain the tween so cleanup can kill it. Without retention, an
        // in-flight reveal can keep animating chars on a torn-down DOM
        // node after the component unmounts.
        charTween = gsap.to(split.chars, {
          yPercent: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power3.out",
          stagger: staggerMs / 1000,
          delay,
        });
      } catch (err) {
        // If SplitText fails (chunk-load error, unexpected DOM shape,
        // etc.) the heading would otherwise stay invisible because the
        // SSR style hides it. Clear the visibility so the original text
        // paints — a degraded but readable experience beats a blank
        // headline.
        el.style.visibility = "";
        if (process.env.NODE_ENV !== "production") {
          console.warn("[RevealHeading] split failed; showing raw text", err);
        }
      }
    };

    if (document.fonts?.ready) {
      // No native AbortSignal for fonts.ready, so we guard the callback
      // body with a `cancelled` flag set by cleanup. Without this, a
      // StrictMode double-mount or fast unmount can split detached DOM
      // long after the component is gone.
      document.fonts.ready.then(run);
    } else {
      run();
    }

    // Capture for cleanup — ref.current may already be detached by the
    // time cleanup runs (lint rule react-hooks/exhaustive-deps).
    const capturedEl = el;
    return () => {
      cancelled = true;
      // Kill the char tween first so it can't keep ticking on the
      // split DOM after revert() removes it.
      charTween?.kill();
      charTween = null;
      split?.revert();
      // If unmounted before fonts.ready resolves, restore visibility so
      // a re-mount paints. The SSR style sets visibility:hidden; clear
      // it on the captured element. React Fast Refresh and route changes
      // don't leave a blank element on screen.
      if (capturedEl) capturedEl.style.visibility = "";
    };
  }, [staggerMs, distance, delay]);

  return (
    <Tag
      ref={ref}
      className={className}
      // SSR-set visibility:hidden suppresses the un-split text from
      // painting before the SplitText effect runs (was a FOUC source
      // when the gate lived in useEffect). The useEffect clears it
      // after split, or immediately for reduced-motion users.
      style={{ display: "inline-block", visibility: "hidden" }}
    >
      {children}
    </Tag>
  );
}
