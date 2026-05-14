# Checkpoint — 2026-05-15
_Mode: quick | Skill version: 1.0_

## Done this session
- Fixed cross-route scroll restoration: navigating from a deep-scrolled
  Home to About (or any other page) now snaps to the top instead of
  preserving scroll position. `components/SmoothScroll.tsx` gained a
  `usePathname()` effect that calls `ScrollSmoother.get().scrollTop(0)`
  with a `window.scrollTo(0, 0)` fallback for the reduced-motion path
  (no smoother instance). Root cause: ScrollSmoother manages scroll via
  transforms on `#smooth-content`, so Next's default scroll-to-top on
  navigation didn't reach it.
- Manually verified in the browser on `localhost:3000` — Joon confirmed
  the fix.

## In progress
- _Nothing in progress; the SmoothScroll change is the only unstaged
  diff and is ready to commit._

## Next
- Commit and push `components/SmoothScroll.tsx` on branch `hobobranch`.

---

## Resume prompt

> Please read MEMORY.md, CHECKPOINT.md, and any other relevant .md files to get up to speed. Note: this was a quick checkpoint, so MEMORY.md may be slightly stale — the source of truth for this session is CHECKPOINT.md. Give me a brief summary of where we left off and what's next. Specifically, pick up from: Commit and push `components/SmoothScroll.tsx` on branch `hobobranch`.
