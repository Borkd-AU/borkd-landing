"use client";

/**
 * ReadingShell — long-form reading chrome for /privacy and /terms. Wraps
 * the article and adds:
 *
 *   1. **Reading progress bar** — fixed 2px strip at the top of the
 *      viewport, fills left→right with scroll progress. ScrollTrigger
 *      with scrub keeps it locked to the scroll position with no jitter.
 *   2. **Sticky table of contents** — desktop-only (lg+) left rail.
 *      Auto-generated from h2 elements inside the article. Clicking an
 *      entry smooth-scrolls to that section using ScrollSmoother (so it
 *      respects the page-wide smooth scroller) with a sensible offset.
 *
 * Mobile (< lg) gets the progress bar only — no TOC, page falls back to
 * the default linear reading flow.
 *
 * `prefers-reduced-motion: reduce` → progress bar still renders (no
 * motion involved) but TOC click is instant (no smooth scroll).
 *
 * SSR-safe: shell renders empty TOC on the server; the IDs and entries
 * are populated client-side after mount when the article DOM exists.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { gsap, ScrollTrigger, ScrollSmoother, ScrollToPlugin } from "@/lib/gsap";

interface TocEntry {
  id: string;
  text: string;
}

interface Props {
  children: ReactNode;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function ReadingShell({ children }: Props) {
  const articleRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [entries, setEntries] = useState<TocEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  // SSR: document.body doesn't exist. Render the portal only after mount.
  // Without this, calling createPortal on the server throws. The double
  // render this causes (server: null portal; client: real portal) is the
  // entire point — same pattern as CursorDog/useReactiveMode.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Generate TOC + assign ids to h2s. Runs once after mount; article is
  // server-rendered so the DOM is ready synchronously.
  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;

    const headings = Array.from(root.querySelectorAll<HTMLHeadingElement>("h2"));
    const seen = new Set<string>();
    const list: TocEntry[] = headings.map((h) => {
      const base = slugify(h.textContent ?? "");
      let id = base || "section";
      let n = 2;
      while (seen.has(id)) id = `${base}-${n++}`;
      seen.add(id);
      h.id = id;
      // Pad the scroll-anchor so the highlighted h2 doesn't sit jammed
      // under the floating nav pill after a click jump.
      h.style.scrollMarginTop = "120px";
      return { id, text: h.textContent ?? "" };
    });
    setEntries(list);

    // Active-section tracking. One trigger per heading, fires when its top
    // crosses the 25% line of the viewport. ScrollTrigger handles direction
    // changes (scrolling up re-activates the prior heading) without us
    // wrangling Intersection Observer state.
    const triggers = headings.map((h, idx) =>
      ScrollTrigger.create({
        trigger: h,
        start: "top 25%",
        end: "bottom 25%",
        onEnter: () => setActiveId(list[idx].id),
        onEnterBack: () => setActiveId(list[idx].id),
      }),
    );

    // Initial active = the heading currently above the activation line.
    // Without this, nothing is highlighted on first paint.
    requestAnimationFrame(() => {
      const top = window.scrollY + window.innerHeight * 0.25;
      let current: string | null = list[0]?.id ?? null;
      for (let i = 0; i < headings.length; i++) {
        const h = headings[i];
        const y = h.getBoundingClientRect().top + window.scrollY;
        if (y <= top) current = list[i].id;
        else break;
      }
      setActiveId(current);
    });

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);

  // Reading progress bar — scrubbed via ScrollTrigger so it tracks the
  // smoothed scroll position rather than the raw scrollY (which differs
  // under ScrollSmoother).
  useEffect(() => {
    const bar = progressRef.current;
    if (!bar) return;
    gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        gsap.set(bar, { scaleX: self.progress });
      },
    });
    return () => trigger.kill();
  }, []);

  function handleTocClick(id: string, e: React.MouseEvent) {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // Use ScrollSmoother when present (page-wide smooth scrolling is gated
    // to desktop in SmoothScroll.tsx); fall back to ScrollToPlugin otherwise.
    const smoother = ScrollSmoother.get();
    if (smoother) {
      smoother.scrollTo(target, !reduced, "top 100px");
    } else {
      gsap.to(window, {
        scrollTo: { y: target, offsetY: 100 },
        duration: reduced ? 0 : 0.6,
        ease: "power2.out",
      });
    }
    // Reference ScrollToPlugin so tree-shaking doesn't drop it from the
    // production bundle on pages where the fallback path is the only user.
    void ScrollToPlugin;
  }

  // ScrollSmoother transforms #smooth-content every frame. position: fixed
  // inside a transformed ancestor becomes "fixed to the ancestor" — i.e.
  // it scrolls with the page. To keep the progress bar and TOC actually
  // viewport-fixed, we portal them out to document.body, which sits
  // OUTSIDE the smoother's containing block.
  const overlays = (
    <>
      {/* Reading progress bar — fixed, full-width, 2px violet. Above the
          header but below dialogs. z-50 matches the existing header z.
          NOTE on h-[2px]: the design system's smallest size step is 4px
          (XXXSmall). A 2px progress strip is intentionally sub-scale —
          this is the "decorative micro-line" exception in DESIGN-RULES
          §1 rule 2 (1–2px hairlines map to nothing in the scale). */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] bg-content-accent/15"
      >
        <div ref={progressRef} className="h-full w-full bg-content-accent" />
      </div>

      {/* Floating TOC — pinned to the left rail (position: fixed), visible
          from lg+ (1024px). At 1024–1279 the rail sits closer to the edge
          (narrower, smaller text) so it doesn't overlap the article's
          820px column; at xl+ it gets more room. */}
      <nav
        aria-label="Page contents"
        className="pointer-events-none fixed top-32 z-40 hidden lg:left-4 lg:block lg:w-40 xl:left-8 xl:w-48"
      >
        {entries.length > 0 ? (
          <ul className="pointer-events-auto space-y-2 text-xs xl:text-sm">
            <li className="mb-3 font-display uppercase tracking-widest text-content-primary/50 text-[10px] xl:text-xs">
              On this page
            </li>
            {entries.map((entry) => {
              const active = entry.id === activeId;
              return (
                <li key={entry.id}>
                  <a
                    href={`#${entry.id}`}
                    onClick={(e) => handleTocClick(entry.id, e)}
                    className={`block border-l-2 py-1 pl-3 leading-snug transition-colors duration-200 ${
                      active
                        ? "border-content-accent text-content-brand"
                        : "border-transparent text-content-primary/60 hover:text-content-primary"
                    }`}
                  >
                    {entry.text}
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}
      </nav>
    </>
  );

  return (
    <>
      {mounted ? createPortal(overlays, document.body) : null}
      <div ref={articleRef}>{children}</div>
    </>
  );
}
