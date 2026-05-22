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
  const tocRef = useRef<HTMLElement | null>(null);
  const mobileTocRef = useRef<HTMLDivElement | null>(null);
  const [entries, setEntries] = useState<TocEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  // SSR: document.body doesn't exist. Render the portal only after mount.
  // Without this, calling createPortal on the server throws. The double
  // render this causes (server: null portal; client: real portal) is the
  // entire point — same pattern as CursorDog/useReactiveMode.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Generate TOC + assign ids to h2s. Article children are server-rendered
  // so the DOM is laid out synchronously by the time this effect runs.
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

    // Initial active = the heading currently above the activation line.
    // Without this, nothing is highlighted on first paint.
    requestAnimationFrame(() => {
      const top = window.scrollY + window.innerHeight * 0.3;
      let current: string | null = list[0]?.id ?? null;
      for (let i = 0; i < headings.length; i++) {
        const h = headings[i];
        const y = h.getBoundingClientRect().top + window.scrollY;
        if (y <= top) current = list[i].id;
        else break;
      }
      setActiveId(current);
    });

    // Per-frame fallback + footer-overlap fix, both on the gsap ticker so
    // they ride the same RAF clock as ScrollSmoother (and degrade cleanly
    // when it isn't present). Two responsibilities:
    //
    //   1. Tail-section activation: the per-heading ScrollTriggers above
    //      can't fire for sections at the very bottom of the page —
    //      their tops can't reach the 30% line because the page ends
    //      first. So every tick we ALSO scan headings and force-activate
    //      whichever heading sits closest to (but not below) the top of
    //      the viewport. This redundantly handles the middle of the page
    //      too — cheap (read-only getBoundingClientRect) and bulletproof.
    //   2. Footer fade: detect when the article's bottom edge has passed
    //      the top of the viewport. Once it has, the user is reading the
    //      footer, and the floating TOC has no business being there.
    //      Fade opacity to 0 + disable pointer events.
    const articleEl = articleRef.current;
    // Activation line: the y-coordinate (from viewport top) above which a
    // heading is considered "passed" and therefore active. We pick the
    // most recent heading whose top is <= this value.
    //
    // Originally we used 140px (just below the floating nav). That works on
    // dense pages but fails on long pages with short tail sections: when
    // the user has scrolled so much that 3+ sections fit in the viewport
    // simultaneously, only the one whose top crossed the 140px line gets
    // active — even though the visually-dominant section is lower down.
    //
    // Using 45% of the viewport height tracks what the user is actually
    // *reading* (centre of attention) rather than what's at the top of
    // the chrome. Tested with the 12-heading /privacy and 14-heading
    // /terms layouts.
    const probeFromTop = Math.round(window.innerHeight * 0.45);
    let lastActiveIdx = -1;
    let tocHidden = false;
    // Active classes — both desktop side rail and mobile pill use the
    // same active/inactive class pair, so one source of truth here.
    const activeCls = ["border-content-accent", "text-content-brand"];
    const inactiveCls = ["border-transparent", "text-content-primary/60"];
    function syncToc() {
      // 1. Active section — scan back-to-front for the last heading whose
      //    top is at or above the probe line. This naturally handles both
      //    middle-of-page and bottom-of-page (where multiple headings may
      //    all sit above the probe simultaneously — the latest one wins).
      let idx = -1;
      for (let i = headings.length - 1; i >= 0; i--) {
        if (headings[i].getBoundingClientRect().top <= probeFromTop) {
          idx = i;
          break;
        }
      }
      if (idx === -1) idx = 0;
      if (idx !== lastActiveIdx) {
        lastActiveIdx = idx;
        const newId = list[idx].id;
        // React state path (kept for the mobile pill's headline text + a11y)
        setActiveId(newId);
        // DOM mutation path. React state updates are subject to closures,
        // batching, and portal re-render quirks we've been chasing; directly
        // toggling classes on the rendered anchors is guaranteed-immediate
        // and the closure-correct list of anchors lives in scope here.
        const allAnchors = document.querySelectorAll<HTMLAnchorElement>(
          'nav[aria-label="Page contents"] a[href^="#"], #mobile-toc-list a[href^="#"]',
        );
        allAnchors.forEach((a) => {
          const isActive = a.getAttribute("href") === `#${newId}`;
          activeCls.forEach((c) => a.classList.toggle(c, isActive));
          inactiveCls.forEach((c) => a.classList.toggle(c, !isActive));
        });
      }

      // 2. Visibility — fade out both the desktop sidebar AND the mobile
      //    pill the moment the footer enters the viewport. Background
      //    note: the <html> element paints cream (background-brand) as a
      //    backstop for ScrollSmoother overscroll, while <main> paints
      //    white. The TOC is fixed-positioned so it floats over whichever
      //    background is behind it. Even when the TOC's box is strictly
      //    above the <footer> element, the cream margin between main and
      //    footer is visually identical to footer cream — the user reads
      //    that as "TOC on top of footer". Easiest fix: hide the TOC as
      //    soon as ANY cream area enters the viewport from the bottom.
      //    Use footerTop < viewportHeight as the signal, with a small
      //    margin so the transition begins just before cream appears.
      const footerEl = document.querySelector("footer");
      const footerTop = footerEl
        ? footerEl.getBoundingClientRect().top
        : Number.POSITIVE_INFINITY;
      // Fade-out fires when the footer has entered the lower ~30% of the
      // viewport (footerTop < innerHeight * 0.7). That's late enough to
      // keep TOC visible while the user is reading the last section, but
      // early enough to clear it before the page hits its scroll max.
      // Empirically validated on /terms (innerHeight 772):
      //   scrollY=2700 footerTop=877 (>540) → visible (still reading Contact)
      //   scrollY=2850 footerTop=727 (>540) → visible
      //   scrollY=2950 footerTop=627 (>540) → visible
      //   scrollY=3067 footerTop=510 (<540) → hidden (page bottom)
      // Cross-checked by Codex with the same numbers — `0.5` variants
      // never fire at max scroll on this layout, and articleBottom-based
      // gates have the same problem. 0.7 is the cleanest one-expression
      // gate that satisfies both "stay visible while reading" and "hide
      // at the actual end of the page".
      const shouldHide = footerTop < window.innerHeight * 0.7;
      if (shouldHide !== tocHidden) {
        tocHidden = shouldHide;
        if (tocRef.current) {
          tocRef.current.style.opacity = shouldHide ? "0" : "1";
          tocRef.current.style.pointerEvents = shouldHide ? "none" : "";
        }
        if (mobileTocRef.current) {
          mobileTocRef.current.style.opacity = shouldHide ? "0" : "1";
          mobileTocRef.current.style.pointerEvents = shouldHide ? "none" : "";
        }
      }

      // Reset max-height if a previous version of this code set it.
      // No-op once it's clean, but defends against stale inline styles
      // surviving hot reload during development.
      if (tocRef.current && tocRef.current.style.maxHeight) {
        tocRef.current.style.maxHeight = "";
      }
    }

    // Trigger syncToc via:
    //   1. scroll + resize listeners (handles user-driven scroll, the
    //      primary case)
    //   2. an IntersectionObserver on each heading (handles programmatic
    //      scroll, hash-jumps, ScrollSmoother's transform-based scroll,
    //      and any other case where scroll events don't fire reliably —
    //      the IO browser-side machinery detects visibility changes
    //      regardless of how the element got into view)
    //   3. a periodic safety tick every 500ms (defense in depth; cheap
    //      enough to never matter and bulletproof for the long tail of
    //      "why didn't the indicator update?" reports)
    // Each path schedules through the same RAF-throttled `schedule` so
    // we never call syncToc more than once per frame.
    // Throttle to ~one call per 16ms via setTimeout instead of rAF.
    // rAF stops firing when the tab is backgrounded, which leaves
    // syncToc forever pending. setTimeout keeps ticking in the
    // background, which is what we want for the safety interval and
    // for the moment the user tabs back in.
    let scheduledTimer: number | null = null;
    function schedule() {
      if (scheduledTimer != null) return;
      scheduledTimer = window.setTimeout(() => {
        scheduledTimer = null;
        syncToc();
      }, 16);
    }
    syncToc(); // initial paint
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const io = new IntersectionObserver(
      () => schedule(),
      { rootMargin: "0px", threshold: [0, 0.5, 1] },
    );
    headings.forEach((h) => io.observe(h));
    if (articleEl) io.observe(articleEl);
    const safetyTick = window.setInterval(schedule, 500);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      io.disconnect();
      window.clearInterval(safetyTick);
      if (scheduledTimer != null) window.clearTimeout(scheduledTimer);
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

      {/* Mobile floating TOC — a frosted-glass pill at the bottom of the
          viewport. Closed: shows the current section name with a chevron.
          Tap to expand upward into the full list. Hidden on lg+ where the
          side rail TOC takes over. Same article-bottom fade as desktop.
          Tokens only: bg-background-brand/80 + backdrop-blur for the
          frost; border-border-muted for the outline; content-* for text. */}
      {entries.length > 0 ? (
        <div
          ref={mobileTocRef}
          className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 transition-opacity duration-300 ease-out lg:hidden"
        >
          <div
            className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-border-muted bg-background-brand/80 shadow-md backdrop-blur-md transition-all duration-300 ease-out ${
              mobileOpen ? "max-h-[60vh]" : "max-h-14"
            }`}
            style={{ WebkitBackdropFilter: "blur(12px)" }}
          >
            {/* Header pill — always visible. Tap toggles. aria-expanded
                lets assistive tech announce open/closed state. */}
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="mobile-toc-list"
              onClick={() => setMobileOpen((o) => !o)}
              className="flex h-14 w-full items-center justify-between gap-3 px-5 text-left"
            >
              <span className="flex min-w-0 items-baseline gap-2 text-sm">
                <span className="font-display text-xs uppercase tracking-widest text-content-primary/50">
                  On this page
                </span>
                <span className="truncate text-content-brand">
                  {entries.find((e) => e.id === activeId)?.text ?? entries[0].text}
                </span>
              </span>
              <svg
                viewBox="0 0 16 16"
                width="14"
                height="14"
                fill="none"
                aria-hidden="true"
                className={`shrink-0 text-content-primary/60 transition-transform duration-300 ${
                  mobileOpen ? "rotate-180" : "rotate-0"
                }`}
              >
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Expanded list. overflow-y-auto so long TOCs (terms has 14
                headings) scroll inside the pill rather than overflowing
                the viewport. */}
            <ul
              id="mobile-toc-list"
              className="max-h-[calc(60vh-3.5rem)] overflow-y-auto border-t border-border-muted px-5 py-3"
            >
              {entries.map((entry) => {
                const active = entry.id === activeId;
                return (
                  <li key={entry.id}>
                    <a
                      href={`#${entry.id}`}
                      onClick={(e) => {
                        handleTocClick(entry.id, e);
                        setMobileOpen(false);
                      }}
                      className={`block border-l-2 py-2 pl-3 text-sm leading-snug transition-colors duration-200 ${
                        active
                          ? "border-content-accent text-content-brand"
                          : "border-transparent text-content-primary/70"
                      }`}
                    >
                      {entry.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      {/* Floating TOC — pinned to the left rail (position: fixed), visible
          from lg+ (1024px). At 1024–1279 the rail sits closer to the edge
          (narrower, smaller text) so it doesn't overlap the article's
          820px column; at xl+ it gets more room. */}
      <nav
        ref={tocRef}
        aria-label="Page contents"
        // max-h + overflow-y-auto keeps the TOC bounded so it can't grow
        // taller than the viewport on long terms-of-service pages (14
        // headings). Without this the footer-push logic in syncToc would
        // slide a 557px tall TOC up far enough that its top sails out of
        // the viewport. With max-h-[calc(100vh-160px)] the TOC is at
        // most ~640px on a 800px viewport — always fully visible.
        className="pointer-events-none fixed top-32 z-40 hidden max-h-[calc(100vh-10rem)] overflow-y-auto transition-[top,opacity] duration-300 ease-out lg:left-4 lg:block lg:w-40 xl:left-8 xl:w-48"
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
