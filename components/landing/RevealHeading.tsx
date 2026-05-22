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
import { gsap, SplitText } from "@/lib/gsap";

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
    if (reduced) return;

    // Hide until SplitText has done its DOM work; otherwise the user
    // sees the original text for a frame before the per-char spans
    // replace it (FOUC).
    gsap.set(el, { autoAlpha: 0 });

    let split: InstanceType<typeof SplitText> | null = null;
    // Defer one frame so layout (fonts, line-wrapping) settles before split.
    // Without this, SplitText can split on a pre-font-load layout and the
    // chars jump when the web font finally arrives.
    //
    // Split both `chars` AND `words`. Char-only splits set each character
    // to display:inline-block, which breaks the browser's normal word-
    // wrapping (words can break mid-word at any character boundary, so
    // "line." can wrap as "lin / e."). With `words` also split, each word
    // is wrapped in its own inline-block container that the browser treats
    // as an atomic unit for wrap — chars animate, words wrap as expected.
    const run = () => {
      split = new SplitText(el, {
        type: "chars,words",
        charsClass: "reveal-char",
        wordsClass: "reveal-word",
      });
      gsap.set(split.chars, { yPercent: (distance / 14) * 100, opacity: 0 });
      gsap.set(el, { autoAlpha: 1 });
      gsap.to(split.chars, {
        yPercent: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power3.out",
        stagger: staggerMs / 1000,
        delay,
      });
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(run);
    } else {
      run();
    }

    return () => {
      split?.revert();
      // If unmounted before fonts.ready resolves, make sure the element
      // isn't left at autoAlpha 0.
      gsap.set(el, { clearProps: "opacity,visibility" });
    };
  }, [staggerMs, distance, delay]);

  return (
    <Tag ref={ref} className={className} style={{ display: "inline-block" }}>
      {children}
    </Tag>
  );
}
