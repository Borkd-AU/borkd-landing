/**
 * Pure functions for the reading-shell TOC state machine. Extracted so
 * the math is independently testable without a browser or GSAP.
 *
 * Invariant (the whole point of this module):
 *
 *   For every heading entry, there exists a reachable scrollY in
 *   [0, scrollMax] where that entry is the active entry AND the TOC is
 *   visible. Active-index computation and visibility computation are
 *   independent — neither can gate the other.
 *
 * The previous coupled implementation in ReadingShell hid the TOC the
 * moment the page footer entered the viewport bottom 30%. On long pages
 * with short tail sections (one-paragraph "Governing law" / "Contact"
 * style), the final headings sit less than 25vh above the footer, so
 * the TOC faded out before they could become active. See git log on
 * ReadingShell.tsx through commit 7d70424 for context.
 */

export interface HeadingGeometry {
  /** Heading top in document coords (smoother.offset() or rect.top + scrollY). */
  offset: number;
}

export interface ReadingGeometry {
  headings: HeadingGeometry[];
  /** Bottom edge of the article element in document coords. */
  articleBottomOffset: number;
  /** Current scroll position (smoother.scrollTop() or window.scrollY). */
  scrollY: number;
  /** Max scrollable position. document.documentElement.scrollHeight - innerHeight. */
  scrollMax: number;
  viewportH: number;
}

/**
 * Active heading index.
 *
 * The rule changes depending on whether the user is in the body of the
 * article or in the final-screen "tail" region. The tail region is
 * defined as `scrollMax - scrollY < viewportH` — the user can see the
 * document end in the viewport. Pages with short final sections
 * (one-paragraph "Governing law" / "Contact" pattern on /privacy and
 * /terms) cluster multiple headings into this tail. Without a
 * tail-specific rule, a single probe at the centre of attention parks
 * active on whichever heading happens to land near the probe line and
 * leaves the rest of the tail unreachable.
 *
 *   • **Body region** (`scrollMax - scrollY >= viewportH`).
 *     Probe scan: the last heading whose viewport-top distance is at
 *     or above `viewportH * PROBE_RATIO`. Probe at 45% tracks the
 *     centre of reading attention rather than top chrome.
 *
 *   • **Tail region** (`scrollMax - scrollY < viewportH`).
 *     "Passed-by-top" scan: the last heading whose top has scrolled
 *     above viewport top, i.e. `offset <= scrollY`. As the user
 *     scrolls each remaining heading past the top, it claims active
 *     in turn. Plus a terminal snap within `END_EPSILON` of scroll
 *     max so sub-pixel rounding from smoother.scrollTop() doesn't
 *     keep active off the last heading.
 *
 * Start fallback: nothing fires (page top, no heading in view yet) →
 * return 0, the user is reading the first section.
 *
 * Invariant (pinned by readingState.test.ts): every heading is active
 * for some reachable scrollY in [0, scrollMax]. Coupled with
 * shouldShowToc's independence, the TOC indicator always catches up to
 * the reader before the chrome hides.
 */
const PROBE_RATIO = 0.45;
const END_EPSILON = 4; // px — covers rounding from smoother.scrollTop()
export function getActiveIdx(g: ReadingGeometry): number {
  const n = g.headings.length;
  if (n === 0) return -1;

  const inTailRegion = g.scrollMax - g.scrollY < g.viewportH;

  // Body probe scan at 45% — primary signal in the body region, and a
  // monotone lower bound in the tail region. Computed unconditionally
  // so we can merge with the tail rule below without backsliding.
  const probeFromTop = Math.round(g.viewportH * PROBE_RATIO);
  let bodyIdx = -1;
  for (let i = n - 1; i >= 0; i--) {
    if (g.headings[i].offset - g.scrollY <= probeFromTop) {
      bodyIdx = i;
      break;
    }
  }

  if (inTailRegion) {
    // Terminal snap: pinned at the bottom, hand active to the last
    // heading regardless of whether it ever reached the probe (it
    // might not, if the heading sits within (1 - PROBE_RATIO) of the
    // document bottom).
    if (g.scrollY >= g.scrollMax - END_EPSILON) return n - 1;
    // Passed-by-top: the last heading the user has scrolled past.
    let passedIdx = -1;
    for (let i = n - 1; i >= 0; i--) {
      if (g.headings[i].offset <= g.scrollY) {
        passedIdx = i;
        break;
      }
    }
    // Merge: take the later of probe vs passed-by-top so the body→tail
    // mode switch can never make active jump backward. The body probe
    // was already a valid signal one pixel ago; the tail rule only
    // *adds* coverage for headings the probe can't reach.
    return Math.max(bodyIdx, passedIdx, 0);
  }

  // Body region: probe scan is the answer. Start fallback (idx 0)
  // when the user is still above the first heading.
  return bodyIdx === -1 ? 0 : bodyIdx;
}

/**
 * TOC visibility. Returns true while the user is still reading article
 * content, false once they've passed it.
 *
 * Hide trigger: the article's bottom edge has scrolled past the upper
 * half of the viewport. At that point the user is reading page chrome
 * (cream margin, footer), not article content, so the floating TOC has
 * no business being there.
 *
 * Independent of getActiveIdx — they must never gate each other. See
 * the module-level invariant.
 */
const HIDE_RATIO = 0.5;
export function shouldShowToc(g: ReadingGeometry): boolean {
  const articleBottomFromTop = g.articleBottomOffset - g.scrollY;
  return articleBottomFromTop >= g.viewportH * HIDE_RATIO;
}
