# Cursor Dog — Design Spec

**Status:** Design draft — asset work (shout-lines SVG) required before implementation
**Date:** 2026-05-20
**Author:** Brainstormed with adversarial review by Codex (11 invocations: 1 approach review + 4 section-level reviews + 6 whole-spec rounds, final verdict "READY FOR HANDOFF")

## Summary

A brand-delight feature for the borkd.app landing page: the Borkd dog-head logo follows the cursor on a visibly slack leash on desktop, idle-sniffs when the cursor sits still, and occasionally barks with a head-tilt + line-art cartoon shout lines. On mobile (touch-only), a static dog sits in a fixed corner with the same bark animation. Reduced-motion auto-hides the entire feature.

The feature is decorative, non-load-bearing, and must not regress the landing page's recently-optimized LCP or interfere with the waitlist conversion path.

## Goals & non-goals

**Goals:**
- Make the landing page feel alive and on-brand.
- Honor accessibility (reduced motion, aria-hidden, keyboard nav untouched).
- Add < 8 KB gzipped, deferred past first paint.

**Non-goals:**
- Sound (autoplay restrictions + annoyance risk).
- Pixel-perfect dog animation (the source SVG is a single-stroke mark with no decomposable head — whole-mark rotation is the spec).
- A persistent state across sessions (no localStorage, no opt-in / opt-out UI).

## 1. Architecture

**Stack:** GSAP (already in repo) + inline SVG. No new dependencies.

**Mount:** The component mounts in `app/layout.tsx` **outside** `#smooth-wrapper`, mirroring `FloatingTopBar`'s pattern. Loaded via `dynamic()` with `ssr: false` and scheduled inside a `requestIdleCallback` so all dog code is deferred past first paint.

**Position layer:** A wrapping `<div role="presentation" data-cursor-dog>` with `position: fixed; inset: 0; pointer-events: none; z-index: 60`. The `<svg>` lives inside; the `<svg>` is **not** the fixed layer.

**Coordinate model:** Single space — CSS pixels mapped 1:1 by the SVG viewBox (`viewBox="0 0 ${innerWidth} ${innerHeight}"`, synced on `resize`). All math (cursor, dog, leash) lives in this space. Cursor reads come from `clientX/clientY`; no `getBoundingClientRect` of content.

**SVG structure (desktop branch):**

```
<div data-cursor-dog ...>     <!-- position layer -->
  <svg viewBox="0 0 vw vh">   <!-- viewport-sized -->
    <path ref={leashRef} />
    <g ref={dogRef} transform="translate(x,y)">  <!-- GSAP quickTo writes this -->
      <g ref={headRef} style="transform-origin: 16px 22px">
        <path d="...vector6-logo path..." />
      </g>
      <g ref={shoutRef} opacity="0">
        <path d="...cartoon shout lines..." />
      </g>
    </g>
  </svg>
</div>
```

**`shoutRef` hierarchy (deliberate):** `shoutRef` is a sibling of `headRef`, **not a child**. Consequence: the head-tilt rotation in the bark timeline applies only to `headRef` — the shout lines stay axis-aligned during the 12° tilt. This is intentional. Nesting `shoutRef` inside `headRef` would rigid-rotate the entire bark burst with the head, which at 12° reads as the shout lines "swinging" with the dog and breaks the cartoon convention of bark lines as ambient sound indicators. Implementation must preserve sibling order; do not "fix" by reparenting.

On mobile, the same root layer hosts a **small fixed-size SVG** (no viewBox sync, no leash element).

**Animation engine:** GSAP `quickTo` for the dog's `x/y` transforms. One scoped `gsap.context()` owns every tween and timeline. Non-GSAP lifecycle (event listeners, matchMedia, timer handles) is owned by a single `AbortController` + a `Set<number>` of pending `setTimeout` handles for blanket cleanup. The bark scheduler additionally holds its **own** single `barkTimerHandle` ref (in addition to membership in `pendingTimers`) so that `scheduleBark()` can guard against duplicate scheduling and `peekBarkTimer()` (debug hook) can read it.

**In-flight animation refs** (needed for state transitions that interrupt animations):
- `barkTimelineRef: { current: gsap.core.Timeline | null }` — set to the active bark timeline at the start of the bark-fire callback; nulled in the timeline's `onComplete`. Used by `* → PARKED` and `* → PAUSED_INPUT` transitions to kill an in-flight bark so it doesn't `onComplete → transition('IDLE')` and resurrect a parked dog.
- `sniffTimelineRef: { current: gsap.core.Timeline | null }` — set when entering `SNIFFING`; nulled when leaving. Used by `SNIFFING → BARKING` and other exits from `SNIFFING` to kill the loop with a return-to-baseline.

Effect cleanup runs `gsap.ticker.remove(tick)` + `ctx.revert()` + `controller.abort()` + `pendingTimers.forEach(clearTimeout)` + `pendingTimers.clear()` + `delete (window as any).__borkdDog`. The ticker removal is **explicit and required** — `gsap.context()` does NOT auto-unregister ticker callbacks (it only manages tweens/timelines); ticker is a separate global system per GSAP docs.

**`pendingTimers` invariants (must hold throughout):**
- Every `setTimeout()` created by CursorDog code adds its handle to `pendingTimers` on creation.
- Every timer callback's **first** statement deletes its own handle from `pendingTimers`.
- `clearBark()` deletes the handle from `pendingTimers` AND nulls `barkTimerHandle`.
- The cleanup function runs `pendingTimers.forEach(clearTimeout)` to cancel any in-flight handles, then `pendingTimers.clear()` to drop the set's references. By then most handles should already be removed by their callbacks; this catches stragglers and frees memory.

This is the only way handles in `pendingTimers` stay consistent with `barkTimerHandle` and with the debug-hook readers.

**Canonical ownership of `gsap.context()`:** Exactly **one** `gsap.context()` exists for the entire CursorDog feature, created by **`index.tsx`'s top-level `useEffect`** scoped to the wrapping `<div data-cursor-dog>` root ref:

```ts
useEffect(() => {
  if (mode === 'disabled') return
  const ctx = gsap.context(() => {
    // hooks expose setup functions; called inside the context so all
    // tweens/timelines/quickTo's they create are scoped to this ctx
    trackerSetup()
    stateMachineSetup()
  }, rootRef.current!)
  return () => {
    gsap.ticker.remove(tick)            // EXPLICIT — gsap.context does NOT cover ticker
    ctx.revert()
    controller.abort()
    pendingTimers.forEach(clearTimeout)
    pendingTimers.clear()
    delete (window as any).__borkdDog
  }
}, [mode])
```

The hooks (`useCursorTracker`, `useDogStateMachine`) are called at the top of `index.tsx` (React rules); they return setup functions that the controller invokes **inside** the `gsap.context()` callback. This guarantees every GSAP creation — including hook-internal ones — is captured by the same context and reverted in one call.

Hooks **do not** create their own `gsap.context()`. There is one and only one.

**Hydration contract:** Server renders `null`. First client render also returns `null` until `useEffect` resolves the mode via `matchMedia`. ~50-100ms flicker on first paint where the dog is absent — intentional, acceptable for brand polish, documented so nobody "fixes" it with SSR matchMedia hacks.

## 2. Components

**Folder layout:** `components/landing/CursorDog/`

```
components/landing/CursorDog/
├─ index.tsx              ← controller; reads mode, renders branch or null
├─ useReactiveMode.ts     ← matchMedia (desktop / mobile / reduced-motion) → mode
├─ useCursorTracker.ts    ← pointer/focus/leave events → target ref + lastMoveAt
├─ useDogStateMachine.ts  ← state enum + transitions + bark/sniff scheduler
├─ DesktopDogSvg.tsx      ← viewport-spanning SVG (leash + dog + shout)
├─ MobileDogSvg.tsx       ← small fixed-size SVG (no leash, no viewport sync)
├─ constants.ts           ← all tunable values
└─ useDogStateMachine.test.ts  ← single unit test on the transition function
```

`index.tsx` is exported via `dynamic(() => import('@/components/landing/CursorDog'), { ssr: false })` from `app/layout.tsx`.

**Constants (`constants.ts`):**

```ts
export const MAX_STRETCH = 240             // px — max leash length (clamp)
export const SNIFF_AFTER_MS = 3000         // ms cursor stationary before sniff
export const BARK_MIN_MS = 20000           // ms — random schedule lower bound
export const BARK_MAX_MS = 40000           // ms — random schedule upper bound
export const BARK_TILT_DEG = 12            // bark head rotation
export const SNIFF_TILT_DEG = -6           // sniff head dip
export const SLACK_DECAY_TAU_MS = 500      // exponential time constant for slack
export const SLACK_VELOCITY_GAIN_K = 0.01  // velocity-to-slack gain; tune visually
export const RAF_WAKE_THRESHOLD_MS = 5000  // RAF pause > this → treat as wake
export const PARK_FADE_OPACITY = 0.4       // dog opacity when parked
export const ENTRY_TROT_MS = 600           // first-appearance trot duration
```

**`safeSet` helper (in `index.tsx` or shared util):**

```ts
function safeSet<T extends Element>(
  ref: RefObject<T>,
  apply: (el: T) => void,
): void {
  if (ref.current != null) apply(ref.current)
}
```

All GSAP writes that touch a CursorDog ref go through this. Callers pass a function that performs the actual `gsap.to(el, ...)` or `gsap.timeline().to(el, ...)`. If the ref is `null` at call time, the closure is never invoked — no null targets.

**Lifecycle safety is owned separately by `gsap.context()`**, not by `safeSet`:
- `safeSet` = **null-ref guard at call time** (handles unmount races where a write fires after the ref clears).
- `gsap.context()` + `ctx.revert()` = **timeline lifecycle** (kills constructed-and-stored timelines on unmount; handles StrictMode double-effect by reverting before recreating).

These are orthogonal. Implementers should not conflate them.

**`quickTo` is special — once-constructed, called per-frame:**

```ts
let quickToX: ((v: number) => gsap.core.Tween) | null = null
let quickToY: ((v: number) => gsap.core.Tween) | null = null

// Construction (once, inside gsap.context() callback) — uses safeSet to guard null ref
safeSet(dogRef, (el) => {
  quickToX = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' })
  quickToY = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' })
})

// Per-frame call (every RAF tick) — NO safeSet wrapping
if (quickToX && quickToY) {
  quickToX(clampedTarget.x)
  quickToY(clampedTarget.y)
}
```

The constructor goes through `safeSet` to guard initial null. The returned setters do **not** go through `safeSet` per frame — GSAP captures the target at construction time, so the setter writes to that captured element directly.

**Lifecycle (the load-bearing argument that the setters are safe post-revert):**

The per-frame `RAF tick` is registered via `gsap.ticker.add(tick)` **inside** the `gsap.context()` callback (alongside the quickTo construction). **The cleanup function MUST explicitly call `gsap.ticker.remove(tick)` BEFORE `ctx.revert()`** — `gsap.context()` does not auto-manage ticker registrations (it only captures tweens/timelines per GSAP docs). With the explicit removal in place, the `tick` function stops firing immediately on cleanup, so `quickToX` / `quickToY` are never called post-cleanup. The `if (quickToX && quickToY)` null check inside `tick` is only for the brief window during mount before the context callback has run.

The guarantee comes from `gsap.ticker.remove(tick)` being called explicitly in cleanup (documented GSAP API), not from any auto-cleanup behavior. **Forgetting the `gsap.ticker.remove` call would leak a post-unmount tick** — flag this prominently in implementation review.

**Refs exposed by the SVG components:**

| Ref | Element | Animated by |
|---|---|---|
| `dogRef` | `<g>` wrapping the dog | x/y transform (quickTo) |
| `headRef` | `<g>` around the logo path | rotation (tilt) |
| `shoutRef` | `<g>` of shout-line paths | opacity + scale (bark) |
| `leashRef` | `<path>` between cursor and dog | `d` attribute updates each frame |

**Asset:** `vector6-logo.svg` is a single continuous `<path>` of a stylized dog mark with no decomposable head. The whole mark is treated as one rigid body. Head-tilt = whole-mark rotation with `transform-origin: 16px 22px` (bottom-center of viewBox, ~neck point).

## 3. State machine & data flow

**State enum:**

```ts
type DogState =
  | 'DISABLED'
  | 'IDLE'
  | 'FOLLOWING'
  | 'SNIFFING'
  | 'BARKING'
  | 'PARKED'
  | 'PAUSED_INPUT'
```

**Transition table** (the source of truth — implementation must match):

| From | Trigger | To | Side effects |
|---|---|---|---|
| `DISABLED` | mount + mode resolved | `IDLE` | schedule first bark timer |
| `IDLE` | pointermove | `FOLLOWING` | update `lastMoveAt = now` (set in the pointermove handler, *before* `transition()` is called — see data flow below) |
| `FOLLOWING` | RAF tick: `now - lastMoveAt > SNIFF_AFTER_MS` | `SNIFFING` | start sniff loop |
| `SNIFFING` | pointermove | `FOLLOWING` | 150ms return-to-baseline tween (`headRef` rotation → 0, `dogRef.y` → 0) |
| `IDLE` / `FOLLOWING` / `SNIFFING` | bark timer fires | `BARKING` | **Side effects in order: (1) callback nulls `barkTimerHandle` + removes its captured handle from `pendingTimers` (first statement); (2) if previous state was `SNIFFING`, `sniffTimelineRef.current?.kill()` + `gsap.set()` `dogRef.y → 0`, `headRef` rotation → 0 instantly + null `sniffTimelineRef` (instant set, not tween — bark is about to animate `headRef`, can't compete with a baseline-restore tween); (3) call `transition('BARKING')`; (4) if and only if the transition was accepted (state is now `BARKING`), construct the bark timeline (~780ms) and store it in `barkTimelineRef.current`.** The accept-check guards against races where state moved to `DISABLED` between steps 2 and 3, preventing an orphaned timeline outside the gsap.context lifecycle. |
| `BARKING` | timeline ends | `IDLE` | reschedule bark in `random(BARK_MIN_MS, BARK_MAX_MS)` |
| any except `DISABLED` | `pointerleave` on `<html>` | `PARKED` | **Side effects run in this order: (1) `barkTimelineRef.current?.kill()` + null it; (2) `sniffTimelineRef.current?.kill()` + null it; (3) `clearBark()` (timer); (4) `gsap.set()` head/shout/dog.y to baseline *instantly* (no tween — avoids racing the trot for `dogRef` ownership); (5) trot dog x → `innerWidth + 32` over 600ms (`power2.in`) + fade opacity → `PARK_FADE_OPACITY`.** Kill-before-trot order prevents bark `onComplete` from firing `transition('IDLE')` after parking; `gsap.set()` precedence rule prevents the sniff-baseline-restore tween from competing with the trot tween for `dogRef` writes. |
| `PARKED` | `pointerenter` on `<html>` | `IDLE` | reschedule bark (guarded: only if no pending bark timer) |
| any except `DISABLED` / `PAUSED_INPUT` / `PARKED` | `focusin` on `input/textarea/[contenteditable]` | `PAUSED_INPUT` | **Side effects in order: (1) `barkTimelineRef.current?.kill()` + null it; (2) `sniffTimelineRef.current?.kill()` + null it; (3) `clearBark()` (timer); (4) `gsap.set()` head/shout/dog.y to baseline instantly — dog stays at its current `dogRef.x` position (the "freeze" intent).** Same kill-before-set order as PARKED; instant `gsap.set` (not tween) for baseline avoids competing animations since the dog is meant to be motionless during input. Covers entry from `BARKING` mid-animation. |
| `PAUSED_INPUT` | `focusout` of last text input (debounced one RAF; re-check `document.activeElement`) | `FOLLOWING` | reschedule bark; resume follow |
| any except `DISABLED` | `visibilitychange → hidden` | `PARKED` | same side effects in the same order as the `pointerleave → PARKED` row above (kill bark timeline → kill sniff timeline → clearBark → gsap.set baseline → trot offscreen + fade) |
| `PARKED` | `visibilitychange → visible` | `IDLE` | reset `lastMoveAt = now`; reschedule bark |
| any | matchMedia mode flip | `DISABLED` → remount | full cleanup (`gsap.ticker.remove(tick) + ctx.revert() + ac.abort() + clearTimers()`); React re-keys on mode |

The `transition(next, reason?): boolean` helper:
- **Signature:** returns `true` if the transition was accepted and applied; `false` if rejected (invalid edge or duplicate state).
- **Synchrony contract (load-bearing):** when accepted, `transition()` updates `stateRef.current = next` **synchronously, before running any side effects from the transition row, before returning, and before any other code path can observe the new value**. This is what makes the bark `onComplete` defensive check (`if (stateRef.current === 'BARKING') ...`) load-bearing — it relies on the previous `transition('BARKING')` having already written the ref. Implementer note: do not defer the ref write into a microtask or scheduler.
- **Enforces:** valid edges from the table (otherwise dev warning + return `false`); rejects duplicate target state (return `false`); funnels all scheduling/clearing of bark and sniff through itself.

**Same-state transitions are permitted no-ops, not invalid edges.** The most common case is `transition('FOLLOWING')` on every `pointermove` while already in `FOLLOWING`: this is **not** a dev warning, just a silent no-op via the duplicate-target rule (returns `false`, callers don't need to check). The pointer handler's `lastMoveAt = performance.now()` runs *before* `transition()` is called and is the only observable effect of continued movement while in `FOLLOWING`. Implementer note: the "valid edges from the table" check should not reject same-state transitions; only edges that don't appear in any row (with any source state) are illegal.

**Named scheduling call sites** (in `useDogStateMachine`):

```ts
function scheduleBark(): void {
  if (barkTimerHandle != null) return                   // guard against duplicates
  const delay = BARK_MIN_MS + Math.random() * (BARK_MAX_MS - BARK_MIN_MS)
  const handle = window.setTimeout(() => {
    pendingTimers.delete(handle)                        // captured const — own handle
    barkTimerHandle = null                              // null before transitioning
    transition('BARKING')
  }, delay)
  barkTimerHandle = handle
  pendingTimers.add(handle)
}

function clearBark(): void {
  if (barkTimerHandle == null) return
  window.clearTimeout(barkTimerHandle)
  pendingTimers.delete(barkTimerHandle)
  barkTimerHandle = null
}
```

The local `const handle` in `scheduleBark` matters: it captures the specific timer's identity, so if `barkTimerHandle` is reassigned by another path (e.g., a race where `clearBark` runs and a new `scheduleBark` starts before this callback fires), the callback still removes the right handle from `pendingTimers`.

`scheduleBark()` is the **only** place a bark timer is created. Called from the side-effect block of:
- `DISABLED → IDLE` (mount: first bark)
- `BARKING → IDLE` (timeline end, reschedule)
- `PARKED → IDLE` (pointerenter or visibilitychange visible)
- `PAUSED_INPUT → FOLLOWING` (focusout)

`clearBark()` is called from the side-effect block of:
- `* → PARKED` (pointerleave or visibilitychange hidden)
- `* → PAUSED_INPUT` (focusin on text input)
- `* → DISABLED` (mode flip; handled by cleanup but explicit for safety)

The bark timeline's `onComplete` callback calls `transition('IDLE')`, which then calls `scheduleBark()` via the table's side-effect block.

**Per-frame data flow** (desktop, `FOLLOWING`):

The `tick` function is registered via `gsap.ticker.add(tick)` inside the `gsap.context()` callback. **Cleanup must explicitly call `gsap.ticker.remove(tick)` before `ctx.revert()`** — GSAP context does not auto-manage ticker registrations. Once explicitly removed, the tick stops firing on unmount/mode-flip, so the data flow loop below cannot fire post-cleanup; no need to guard `quickToX`/`quickToY` for post-revert calls.

```
pointermove (event):
  targetRef       = { x: clientX, y: clientY }    // raw, unclamped
  lastMoveAt      = performance.now()
  transition('FOLLOWING')

RAF tick (registered via gsap.ticker.add; dt from GSAP ticker):
  // Wake-up guard
  if (now - lastFrameAt > RAF_WAKE_THRESHOLD_MS) {
    lastFrameAt = now
    lastMoveAt  = now           // also reset to prevent false SNIFFING
    return                       // skip this frame entirely
  }
  lastFrameAt = now

  // Idle check (no setTimeout churn)
  if (state === 'FOLLOWING' && now - lastMoveAt > SNIFF_AFTER_MS) {
    transition('SNIFFING')
  }

  // Compute target (clamp once per frame)
  clampedTarget = clamp(targetRef, dogPos, MAX_STRETCH)

  // Physics on RAF (single clock)
  velocity = (clampedTarget - lastClampedTarget) / dt
  slack    = slack * exp(-dt / SLACK_DECAY_TAU_MS) + |velocity| * k
  lastClampedTarget = clampedTarget

  // Render (quickToX/quickToY are the captured setters from Section 2)
  if (quickToX && quickToY) {
    quickToX(clampedTarget.x)
    quickToY(clampedTarget.y)
  }
  safeSet(leashRef, (el) => {
    el.setAttribute('d', computeLeashPath(cursorPos, dogPos, slack))
  })
```

**Leash path math** (quadratic Bezier; cubic upgrade deferred to visual tuning):

```
mx = (cx + dx) / 2
my = (cy + dy) / 2
ctrlY = my + 10 + slack * 30  // 10px gravity + up to 30px slack droop
d = `M${cx},${cy} Q${mx},${ctrlY} ${dx},${dy}`
```

**Bark timeline** (~780ms total):

Construction stores the timeline in `barkTimelineRef.current` before steps begin. Steps:

1. `headRef` rotate 0 → `BARK_TILT_DEG` (12°) in 150ms (`power2.out`)
2. `shoutRef` opacity 0 → 1, scale 0.5 → 1 in 80ms — **the scale tween MUST set `svgOrigin: "29.7 7.4"`** (the centroid of the four shout-line origin points in `vector6-shout.svg`'s SVG coordinate space). Without `svgOrigin`, GSAP's SVG `<g>` scale defaults to the parent SVG's `(0,0)` and the strokes will appear to grow from the upper-left corner of the viewport rather than popping from near the dog's mouth — load-bearing for the bark to read correctly. Flag prominently in implementation review.
3. Hold 200ms at peak
4. `shoutRef` opacity 1 → 0 in 150ms
5. `headRef` rotate 12° → 0 in 200ms (`power2.in`)

`onComplete` callback (defensive against late completion if `kill()` didn't propagate cleanly):

```ts
onComplete: () => {
  barkTimelineRef.current = null
  if (stateRef.current === 'BARKING') {
    transition('IDLE')           // normal path: schedules next bark via table side effect
  }
  // else: state already moved on (PARKED, PAUSED_INPUT, DISABLED) — do nothing
}
```

Two safeguards against PARKED-resurrection: (a) explicit `barkTimelineRef.kill()` in PARKED/PAUSED_INPUT entry transitions cancels the `onComplete`; (b) the state check above absorbs any race where the callback still fires.

**Sniff loop** (~1.5s, repeats while in `SNIFFING`):

Construction stores the timeline in `sniffTimelineRef.current` before steps begin. Steps:

1. `dogRef.y` += 4px, `headRef` rotate to `SNIFF_TILT_DEG` (-6°) in 250ms (`sine.inOut`)
2. Return in 200ms
3. Pause 600-1200ms (random)
4. Repeat, with ±8px x-drift per cycle for visual interest

On any exit from `SNIFFING` (`SNIFFING → FOLLOWING`, `SNIFFING → BARKING`, `SNIFFING → PARKED`, `SNIFFING → PAUSED_INPUT`, `SNIFFING → DISABLED`): `sniffTimelineRef.current?.kill()` + 100-150ms return-to-baseline tween (`dogRef.y → 0`, `headRef` rotation → 0) + null `sniffTimelineRef.current`. Each individual transition row above specifies its own duration; this paragraph is the canonical "what kill-sniff means" reference.

**Mobile branch:** No tracker. Fixed position bottom-right (24px from each edge). State machine only cycles `IDLE → BARKING → IDLE`. No leash, no sniff. Mounts `MobileDogSvg` (small fixed-size SVG, no viewBox sync).

## 4. Error handling & degradations

**Policy:** Fail silently. Never throw. Never block the page. No telemetry. No try/catch ratchets — bugs surface.

**Hard failure responses:**

| Failure | Response |
|---|---|
| GSAP plugins / `quickTo` undefined | Module-init guard; controller renders `null` permanently for the session; dev log |
| `matchMedia` unavailable | `useReactiveMode` falls through to `'disabled'`; guard at hook entry |
| SVG ref `null` mid-frame (unmount race) | `safeSet(ref, fn)` no-ops if ref is null — guards write-time only; timeline lifecycle integrity (StrictMode double-mount, late-firing tweens after unmount) is handled by `gsap.context().revert()` |
| RAF paused > `RAF_WAKE_THRESHOLD_MS` (5s) | Next RAF: reset `lastFrameAt` AND `lastMoveAt = now`; skip idle check this frame |
| Listener throws | **No try/catch.** Same posture as GSAP construction — we want to see bugs. Browser logs it; dog may stop; page is unaffected; next mount restarts |

**Degradations:**

| Condition | Behavior |
|---|---|
| `prefers-reduced-motion: reduce` | Dog never renders; reactive both directions |
| Touch-only (`pointer: coarse`, no fine) | Mobile branch |
| `@media print` | Global CSS in `app/globals.css`: `@media print { [data-cursor-dog] { display: none } }` |
| **Any cross-origin iframe** (Instagram embed, future ads, etc.) | Pointer events don't bubble; dog freezes at last position; `quickTo` smooths catch-up on exit; no special-case code |
| Multi-input focus (tab-cycle through form) | `focusout` schedules one-RAF debounce; re-checks `document.activeElement`; only exits `PAUSED_INPUT` if no text input is focused |
| Ctrl+scroll zoom / DPI change | `viewBox` auto-syncs on `resize` |
| Modal / native context menu | Dog still tracks; accepted (cursor is where attention is) |

**Browser quirks:**
- Safari iOS — touch-only, mobile branch
- Safari macOS w/ trackpad — desktop branch
- Firefox / Chrome / Edge — desktop branch, no known issues

## 5. Testing & acceptance

**Manual acceptance + single perf gate + one unit test + dev hook.** No E2E. No visual regression. No telemetry.

**Dev-only debug hook** (added in `useDogStateMachine`):

```ts
if (process.env.NODE_ENV === 'development') {
  ;(window as any).__borkdDog = {
    state: () => stateRef.current,
    // Clear the pending real bark timer first so manual triggers
    // mirror the production bark-fire path (timer nulled before transition).
    triggerBark: () => { clearBark(); transition('BARKING') },
    peekBarkTimer: () => barkTimerHandle,
    peekTracking: () => ({ targetRef, slackRef, lastMoveAt }),
  }
}
```

**Dev hook teardown:** Effect cleanup (the same one that runs `gsap.ticker.remove(tick)` + `ctx.revert()` + `controller.abort()` + `pendingTimers.forEach(clearTimeout)` + `pendingTimers.clear()`) **also** runs `delete (window as any).__borkdDog`. This is the operation that makes acceptance criterion #7's `window.__borkdDog === undefined` post-teardown check possible.

This makes acceptance criteria deterministically verifiable in DevTools console without waiting on random timers.

**Acceptance criteria (must all pass before merge):**

| # | Criterion | Verification |
|---|---|---|
| 1 | Dog follows cursor with visible leash slack on desktop | Visual; move cursor and observe |
| 2 | Leash bounded ≤ ~240px | Whip cursor; verify clamp |
| 3 | Idle sniff after ~3s stationary | Hover + wait; or `__borkdDog.state()` returns `'SNIFFING'` |
| 4 | Bark renders correctly when triggered | `__borkdDog.triggerBark()`; observe head-tilt + shout-lines + baseline return. Schedule correctness: `peekBarkTimer()` non-null when in `IDLE`/`FOLLOWING`/`SNIFFING` |
| 5 | Dog parks offscreen on cursor leave | Move off `<html>`; observe trot + fade |
| 6 | Dog freezes + bark suspended during form typing | Focus email input; `peekBarkTimer()` returns `null`; blur → returns non-null |
| 7 | Reduce-motion: full teardown | OS toggle → reduce; dog vanishes within 1s; no console warnings; no GSAP ticker activity in Performance tab; `window.__borkdDog === undefined` for 5s after |
| 8 | Mobile: static corner mascot + occasional bark | iOS Safari + Android Chrome; verify position + bark cycle |
| 9 | Tab-bg → parked within 1s; tab-return → `IDLE` within 1 frame; `peekBarkTimer()` non-null within 100ms | DevTools background-tab simulation; verify timing |
| 10 | **Precondition: Instagram embed loaded.** Cursor over embed → freeze; exit → smooth catch-up | Wait for IG to render before testing |
| 11 | No `console.error` during normal interaction across 1-10 | DevTools console clean |

**Perf gate (must pass):**

- `next build && next start`; Chrome desktop; DevTools Performance → CPU **4× throttle** (ship gate).
- Scroll into StepsSection; move cursor across while pinned pan runs; record 5s.
- **Pass requires both:**
  - Median ≥ 55 fps
  - **Zero frames > 33ms** (max-frame bound subsumes the p95 case for a 5s/300-frame sample)
- Fail → switch follow loop from `quickTo` to manual RAF lerp (hybrid D); re-run.
- 6× CPU throttle = stress budget; log only, non-blocking.

**One unit test** (`useDogStateMachine.test.ts`, ~30 LOC):

Tests the pure transition function in isolation (no GSAP, no DOM):
- Valid transitions accepted
- Invalid transitions rejected
- Duplicate target state ignored
- Rapid edge-brush `PARKED → IDLE → PARKED` doesn't double-schedule bark

**Browser matrix (required for ship):**

| Browser | Branch | Required? |
|---|---|---|
| Chrome desktop (latest) | Desktop | **Yes — reference** |
| Safari macOS (latest) | Desktop | **Yes** |
| Safari iOS (latest) | Mobile | **Yes** |
| Firefox desktop | Desktop | Best-effort |
| Edge desktop | Desktop | Best-effort |
| Android Chrome | Mobile | Best-effort |

**Bundle & timing budget:**

- **Size:** < 8 KB gzipped delta to homepage First Load JS (verified via `next build` output before/after).
- **Timing:** Dog mounts via `dynamic(() => import('@/components/landing/CursorDog'), { ssr: false })` inside an inner client component that schedules via `requestIdleCallback`. All dog code deferred past first paint.
- **Verify:** Lighthouse LCP unchanged ±50ms vs. baseline; bundle analyzer shows dog in a separate chunk.

**Accessibility:**

- Reduce-motion → criterion #7
- VoiceOver: root carries `aria-hidden="true"`; no announcements
- Keyboard nav: tab through interactive elements; `PAUSED_INPUT` engages on text inputs; no focus trap

**Section 4 ↔ Section 5 coverage matrix** (every Section 4 claim is either tested or explicitly waived):

| Section 4 claim | Verified by |
|---|---|
| GSAP plugins / `quickTo` undefined → null fallback | **Code review only.** Fault injection isn't practical manually. Verify the module-init guard exists in `index.tsx`. |
| `matchMedia` unavailable → 'disabled' | **Code review only.** Verify guard at `useReactiveMode` hook entry. |
| SVG ref null mid-frame → `safeSet` no-ops + `gsap.context()` lifecycle | **Code review only.** Verify: (a) every `gsap.to` / `gsap.timeline().to` call AND every `gsap.quickTo` *constructor* call goes through `safeSet`; (b) `quickToX` / `quickToY` returned setters are called per-frame **without** `safeSet` (correct — GSAP captures the target at construction); (c) all tweens / timelines / quickTo's are created inside the single `gsap.context()` in `index.tsx`'s top-level `useEffect`, so `ctx.revert()` kills everything on unmount. |
| RAF paused >5s → wake guard | **Code review + dev-tool spot check.** Open DevTools → Performance → simulate slow main thread > 5s. Verify dog doesn't immediately enter SNIFFING on resume (`__borkdDog.state()` stays in prior state). |
| Listener throws → silent failure, page intact | **Code review only.** Verify no try/catch wrapping transitions or GSAP calls. |
| `prefers-reduced-motion: reduce` | Criterion #7 |
| Touch-only → mobile branch | Criterion #8 |
| `@media print` → display none | **Manual:** Cmd+P / Print Preview on borkd.app desktop build — dog must not appear in the preview. |
| Cross-origin iframe → dog freezes; smooth catch-up on exit | Criterion #10 (Instagram embed = current cross-origin instance; behavior generalizes) |
| Multi-input focus tab-cycle → debounced exit | **Manual:** Tab through the waitlist form with keyboard — `peekBarkTimer()` and `state()` checked between fields; no bark fired during cycle. |
| Ctrl+scroll zoom → viewBox resyncs | **Manual:** Ctrl+`+` / Ctrl+`-` while dog is visible — leash and dog remain coherent. |
| Modal / native context menu → dog still tracks | **Code review only** (no modals or native context menus in current app surface). |
| Mode flip → full teardown, no leaked timers | **Manual + dev hook:** Toggle reduce-motion on/off 5 times rapidly; verify `window.__borkdDog === undefined` immediately after each "on" toggle; verify `peekBarkTimer()` is a fresh handle (not null and not the previous one) after each "off" toggle. |

**Explicitly NOT tested:**

- Animation timing / position assertions (non-deterministic per frame)
- Visual regression for the dog (constant noise)
- Cross-browser automated runs (manual smoke matrix is the contract)
- "Feels right" — subjective; settled visually during impl

**Out-of-session followups (not blocking ship):**

- 6× CPU throttle stress budget failure → log, tune later
- User reports of bark annoyance → reconsider dismiss UI (currently rejected)

## Initial appearance UX

A leashed dog doesn't materialize at the cursor — it walks in from somewhere. On first pointer activity after mount:

1. Dog's `<g>` starts at `opacity: 0`, positioned at the **right edge** of the viewport (`x = innerWidth + 32, y = innerHeight * 0.6`) — offscreen by ~32px.
2. On first `pointermove`, opacity tweens 0 → 1 over 150ms (`power2.out`) while `quickTo` begins driving the dog toward the cursor.
3. The `quickTo` `duration` is temporarily increased to `ENTRY_TROT_MS` (600ms) for the first transit only, then snaps back to its normal short value (~0.4s).
4. The leash path doesn't render until opacity > 0.5 (avoids drawing a leash to an invisible dog).

This makes the entry coherent with the leash metaphor and avoids the "physically impossible materialize at cursor" issue.

The wrapping `<div>` is in the DOM the whole time after mount (so `pointerleave` listeners attach correctly); only the dog `<g>` is invisible until first pointer activity.

## Required before implementation

- ~~**Shout-lines SVG asset:** Design pass needed.~~ **DONE** — created at `public/images/illustration/vector6-shout.svg` (sibling file; `vector6-logo.svg` left untouched since it's referenced as a static `<img>` by SiteHeader and SiteFooter). 4 short outward-radiating strokes from focal `(29.7, 7.4)` in the logo's coordinate space, matching the logo's `stroke-width="1.95087"`, `stroke-linecap="round"`, no fill, color via `var(--stroke-0, white)`. Codex adversarial review pass: asset geometry clears the logo stroke at all four origins; SVG itself is shippable. Same review surfaced two spec-level defects (now patched above): explicit `svgOrigin` requirement on the bark-timeline scale tween, and the deliberate `shoutRef`/`headRef` sibling hierarchy.

## Open items (in-impl tuning, non-blocking)

- **Visual tuning of leash curve** at long diagonal stretches: quadratic Bezier may look stiff. Cubic upgrade is a 1-line change if needed — defer the call to on-screen review during impl.
- **`SLACK_VELOCITY_GAIN_K`** starting value (0.01) is a guess; tune visually so leash droop feels right.

## Files touched

| File | Action |
|---|---|
| `components/landing/CursorDog/index.tsx` | New |
| `components/landing/CursorDog/useReactiveMode.ts` | New |
| `components/landing/CursorDog/useCursorTracker.ts` | New |
| `components/landing/CursorDog/useDogStateMachine.ts` | New |
| `components/landing/CursorDog/DesktopDogSvg.tsx` | New |
| `components/landing/CursorDog/MobileDogSvg.tsx` | New |
| `components/landing/CursorDog/constants.ts` | New |
| `components/landing/CursorDog/useDogStateMachine.test.ts` | New |
| `app/layout.tsx` | Edit — add `dynamic()` import + idle-callback mount |
| `app/globals.css` | Edit — add `@media print { [data-cursor-dog] { display: none } }` |
| `public/images/illustration/vector6-logo.svg` **or** new `vector6-shout.svg` | New asset / edit — add shout-lines `<g>` (design-pass blocker) |
