# Checkpoint — 2026-05-22

_Mode: quick. Full checkpoint flow skipped because the entire session's
work was already committed, pushed, and Vercel-deployed before the
clear request — there was no in-flight state to capture beyond what
`git log` already records._

## Where we are

- **Branch:** `main` synced with `origin/main` (0 ahead, 0 behind)
- **HEAD:** `59e5f1d`
- **Working tree:** clean (only `.bkit/` untracked, pre-existing)
- **Vercel production:** `dpl_5j1Uo2ThKgWL6P4kDx38vAJjT5LE` — ● Ready,
  alias https://borkd.app

## Shipped this session (newest → oldest)

```
59e5f1d fix(landing): SSR hide pattern for reveals + misc bundle/hydration
7d70424 perf(landing): tighten hot paths + plug GSAP cleanup leaks
306ea47 fix(legal): SSR h2 ids on /privacy and /terms via SectionHeading
eed5c87 refactor(lib): split gsap barrel + extract slugify and SectionHeading
5cc6d3a feat(landing): smooth scroll on every page, TOC reads through smoother
340c723 fix(contact): match SVG aspect ratio so girl-2 isn't squashed
f31627f fix(landing): footer social icons split into separate rows on mobile
018e497 fix(landing): TOC works correctly under ScrollSmoother + adds mobile pill
bbc124d feat(landing): /contact page + floating TOC on legal pages
f3cc9ff feat(landing): editorial motion on /about and /for-venues
ea79b89 docs(design): mandate the control center via DESIGN-RULES.md
6ff6561 feat(cursor-dog): natural motion + disable on touch devices
```

## What landed

- **CursorDog** natural motion (turn-around squash/stretch, wander
  gating on cursor stillness, speed-driven walking bob, softer
  `quickTo`). Disabled entirely on `pointer: coarse`.
- **Design rules** (`docs/DESIGN-RULES.md` + AGENTS.md header):
  `/design-system` page is the single source of truth. 8 hard rules
  + token inventory + PR checklist. Mandatory pre-read for any UI work.
- **Subpages** with editorial scroll-reveal motion (`/about`,
  `/for-venues`). `/contact` rebuilt with big-link list pattern +
  tilt-spotlight cards; intentional 2-line hero ("Drop us / a line.").
- **Long-form legal pages** (`/privacy`, `/terms`): server-rendered
  `<SectionHeading>` puts stable slug ids on all 27 h2s so hash links
  and no-JS visitors land correctly. Floating TOC: desktop sticky
  left rail + mobile frosted-glass pill. Fades when footer enters
  the lower 30% of the viewport.
- **SmoothScroll** runs on every route. `ReadingShell` reads element
  positions through a `viewportTop()` helper that switches between
  `smoother.offset() - smoother.scrollTop()` and native rect — caches
  offsets at mount/resize/safety-tick so per-tick reads are cheap.
- **React/perf optimization round** — Codex 3-stage cross-validation,
  Stage 2 score 28/50 → Stage 3 final 45/50 APPROVED:
  - GSAP barrel split into 4 entrypoints (`lib/gsap.ts` core,
    `lib/gsap-scroll.ts`, `lib/gsap-split.ts`, `lib/gsap-react.ts`)
    so components only pull the plugins they need
  - TiltSpotlightCard rect caching (no per-pointermove layout read)
  - RevealHeading char tween retained for cleanup + SplitText
    try/catch failsafe + fonts.ready cancellation guard
  - CursorDog turn timeline captured by `ctx.add()`; trot tween
    explicitly killed via `killTrotTween()` in cleanup
  - BigLinkRow → server component (no client hooks needed)
  - `next/image priority` → `preload` across SiteHeader and contact
    (Next 16 deprecation)
  - `[data-reveal]` SSR opacity:0 via globals.css, not useEffect
  - SiteHeader SVG manual ReactDOM.preload kept; Image `preload`
    prop removed (Next 16's Image preload does not emit
    `<link rel="preload">` for SVGs)

## Known limitations (intentionally deferred)

- `ReadingShell.tsx` still mixes React state with direct DOM class
  mutation on the TOC anchors. Pragmatic — defends against the
  StrictMode / portal / stale-closure issues we debugged for
  several rounds. Codex did not flag it as a regression.

## Cold-read pointers for the next session

- **Design system** = `app/design-system/page.tsx` (control center) +
  `docs/DESIGN-RULES.md` (the rules). Always read both before any
  UI edit. Tokens only — no hex/rgba/hsl in components.
- **Long-form legal page headings** use `<SectionHeading>` from
  `components/landing/SectionHeading.tsx` so the id is in the SSR
  HTML, not assigned by `ReadingShell` at runtime.
- **GSAP imports** — core from `@/lib/gsap`; plugins from
  `@/lib/gsap-scroll` (ScrollTrigger/ScrollSmoother/ScrollToPlugin),
  `@/lib/gsap-split` (SplitText), `@/lib/gsap-react` (useGSAP).
- **TOC behaviour** lives in `components/landing/ReadingShell.tsx`.
  Three signal sources drive `syncToc`: scroll listener, IO on
  each heading, and a 500ms safety setInterval. Each schedules via
  a 16ms setTimeout throttle (rAF stalls when the tab is
  backgrounded, so we don't use it). Offsets re-measured on resize
  and every 2s via the safety tick.

## Resume prompt for next session

Paste into a fresh Claude Code session:

> Please read AGENTS.md FIRST and invoke the two session-start skills
> listed there (`andrej-karpathy-skills:karpathy-guidelines` and
> `codex-cowork`) BEFORE anything else. Then read this CHECKPOINT.md
> and `docs/DESIGN-RULES.md` to get up to speed. Working tree should
> be clean and synced with `origin/main`; production is live at
> https://borkd.app. No in-flight work to resume — start fresh from
> whatever the user asks next.
</content>
