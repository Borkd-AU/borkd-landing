"use client";

/**
 * TiltSpotlightCard — a card with two mouse-tracked micro-interactions:
 *
 *   1. **Tilt**: rotates up to ±4° on X/Y based on cursor offset from card
 *      centre. Driven by gsap.quickTo so per-frame updates reuse one tween
 *      and don't churn the animator.
 *   2. **Spotlight**: a soft radial gradient that follows the cursor inside
 *      the card. Implemented as CSS custom properties (--mx, --my, --opacity)
 *      so no extra DOM nodes, no React re-renders.
 *
 * Disabled on touch devices (pointer: coarse) and when the user has
 * `prefers-reduced-motion: reduce` set — in both cases the card is a plain
 * static block.
 *
 * Number prop renders the big 01/02/03 mark — gives the cards an editorial
 * spine without descending into bento-grid AI-template territory.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";

interface Props {
  number: string;
  title: ReactNode;
  children: ReactNode;
}

const MAX_TILT_DEG = 4;
const TILT_EASE = "power2.out";
const TILT_DURATION = 0.4;

export function TiltSpotlightCard({ number, title, children }: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    if (reduced || coarse) return;

    const rotateXTo = gsap.quickTo(el, "rotateX", {
      duration: TILT_DURATION,
      ease: TILT_EASE,
    });
    const rotateYTo = gsap.quickTo(el, "rotateY", {
      duration: TILT_DURATION,
      ease: TILT_EASE,
    });

    // Cache the bounding rect — reading it per pointermove is a forced
    // synchronous layout in a high-frequency event handler. We refresh
    // on pointerenter (the most common entry point) and on resize.
    // Scroll position also moves the rect, but scroll + tilt at the
    // same time is rare; per-enter is enough in practice.
    let rect = el.getBoundingClientRect();
    function refreshRect() {
      rect = el!.getBoundingClientRect();
    }

    function onEnter() {
      refreshRect();
    }
    function onMove(e: PointerEvent) {
      const px = (e.clientX - rect.left) / rect.width; // 0..1
      const py = (e.clientY - rect.top) / rect.height; // 0..1
      // Map to ±MAX_TILT_DEG. rotateX is flipped so pushing the cursor
      // up tilts the *top* of the card toward you (intuitive — the card
      // "looks at" the cursor).
      rotateYTo((px - 0.5) * 2 * MAX_TILT_DEG);
      rotateXTo(-(py - 0.5) * 2 * MAX_TILT_DEG);
      el!.style.setProperty("--mx", `${px * 100}%`);
      el!.style.setProperty("--my", `${py * 100}%`);
      el!.style.setProperty("--spotlight-opacity", "1");
    }

    function onLeave() {
      rotateXTo(0);
      rotateYTo(0);
      el!.style.setProperty("--spotlight-opacity", "0");
    }

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", refreshRect);
    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", refreshRect);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="group relative rounded-2xl border border-content-accent/15 bg-background-accent/[0.04] p-6 sm:p-8 [transform-style:preserve-3d] [perspective:1200px] will-change-transform"
      style={
        {
          // Initial centre — keeps the spotlight neutral until pointermove
          // overwrites it. opacity 0 by default so the card looks like a
          // plain block until the cursor enters.
          "--mx": "50%",
          "--my": "50%",
          "--spotlight-opacity": "0",
        } as React.CSSProperties
      }
    >
      {/* Spotlight layer — absolutely positioned, pointer-events-none so the
          card receives mousemove unbroken. Transition on opacity only (the
          gradient itself moves via the CSS variables, no transition needed).
          Colour is the brand accent (Zoomies/500) at 10% via color-mix, so
          the spotlight follows whatever the design system picks — change the
          token once, this card updates with it. No hardcoded hex/rgba. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[var(--spotlight-opacity)] transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(360px circle at var(--mx) var(--my), color-mix(in srgb, var(--color-zoomies-500) 10%, transparent), transparent 60%)",
        }}
      />
      <div className="relative">
        <div className="font-display text-sm tracking-widest text-content-accent/70">
          {number}
        </div>
        <div className="mt-2 h-px w-8 bg-content-accent/40" />
        <h3
          className="mt-4 text-xl tracking-tight text-content-brand sm:text-2xl"
          style={{ fontVariationSettings: "'opsz' 14" }}
        >
          {title}
        </h3>
        <p className="mt-3 text-base leading-relaxed text-content-primary/85 sm:text-lg">
          {children}
        </p>
      </div>
    </div>
  );
}
