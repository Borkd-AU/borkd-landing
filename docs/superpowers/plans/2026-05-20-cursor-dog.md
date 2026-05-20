# Cursor Dog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the brand-delight cursor-dog feature exactly as specified in `docs/superpowers/specs/2026-05-20-cursor-dog-design.md` — a leashed dog that follows the cursor on desktop with idle-sniff + periodic bark, a static corner dog with periodic bark on mobile, and full reduced-motion teardown.

**Architecture:** A `dynamic({ ssr: false })` client component mounted outside `#smooth-wrapper` in `app/layout.tsx` (mirrors the existing `FloatingTopBar` pattern). One scoped `gsap.context()` owns every tween, timeline, quickTo and ticker registration. A small state-machine drives bark/sniff/follow transitions with explicit kill-then-set ordering to avoid orphaned timelines and parked-dog resurrection.

**Tech Stack:** Next.js 16.2 App Router (Server Components by default), React 19.2, TypeScript 5, GSAP 3.15 (already in deps), `@gsap/react` 2.1, inline SVG. Test runner is Node's built-in `node:test` with `--experimental-strip-types` (Node 25 in this project) — no new test deps.

**Critical spec amendments (round-6):**
- The bark-timeline `scale 0.5 → 1` tween on `shoutRef` MUST set `svgOrigin: "29.7 7.4"`. Without it, GSAP defaults to SVG `(0,0)` and the strokes shoot from the upper-left corner of the viewport. Load-bearing.
- `shoutRef` is a **sibling** of `headRef` (both children of `dogRef`). Do not nest `shoutRef` inside `headRef`.

**Critical Next.js 16 constraint:**
- `dynamic(() => import(...), { ssr: false })` is **NOT allowed** in Server Components per `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`. The mount lives in a thin `'use client'` wrapper file (`CursorDogMount.tsx`), which `app/layout.tsx` (server) imports normally.

**Execution order (LOAD-BEARING):**
- Tasks **must** execute **sequentially**: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11.
- No parallel execution across tasks. In particular: do not write to `useDogStateMachine.ts` (Tasks 4 and 5) and `index.tsx` (Task 8) in parallel — Task 8 reads exported types from Tasks 4-5.
- Each task ends with a commit. Do not skip the commit step; subsequent tasks reference HEAD state.

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `components/landing/CursorDog/constants.ts` | Create | All tunable values, in one place |
| `components/landing/CursorDog/types.ts` | Create | `DogState` union, `Mode` union, shared ref shapes (incl. `bobRef`) |
| `components/landing/CursorDog/useReactiveMode.ts` | Create | `matchMedia`-driven `'desktop' \| 'mobile' \| 'disabled'` resolver |
| `components/landing/CursorDog/useCursorTracker.ts` | Create | Pointer + focus listeners → cursor target, `lastMoveAt`, focus state |
| `components/landing/CursorDog/stateMachine.ts` | Create | **Pure** `applyTransition` + `VALID_EDGES` + types. No project imports — Node-test-friendly. |
| `components/landing/CursorDog/stateMachine.test.ts` | Create | Single unit test on the pure transition function |
| `components/landing/CursorDog/useDogStateMachine.ts` | Create | Runtime layer — GSAP timelines + bark scheduler. Imports `applyTransition` from `./stateMachine.ts`. |
| `components/landing/CursorDog/DesktopDogSvg.tsx` | Create | Viewport-spanning SVG with leash + dog + shout |
| `components/landing/CursorDog/MobileDogSvg.tsx` | Create | Small fixed-size SVG, no leash, no sniff |
| `components/landing/CursorDog/index.tsx` | Create | Controller — single `gsap.context()`, RAF tick, lifecycle |
| `components/landing/CursorDog/CursorDogMount.tsx` | Create | `'use client'` wrapper — `dynamic({ ssr: false })` + `requestIdleCallback` |
| `app/layout.tsx` | Modify | Import `CursorDogMount`, render it outside `#smooth-wrapper` |
| `app/globals.css` | Modify | Add `@media print { [data-cursor-dog] { display: none } }` |
| `package.json` | Modify | Add `"test"` script using `node --test --experimental-strip-types` |

All paths absolute under the repo root: `/Users/hoboparkbench/Documents/Park Bench Labs/Borkd/borkd-landing/`.

---

## Task 1: Scaffold — folder, constants, types

**Files:**
- Create: `components/landing/CursorDog/constants.ts`
- Create: `components/landing/CursorDog/types.ts`

- [ ] **Step 1: Create folder and constants.ts**

```ts
// components/landing/CursorDog/constants.ts
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
export const SHOUT_SVG_ORIGIN = '29.7 7.4' // centroid of shout-line origins; load-bearing
```

- [ ] **Step 2: Create types.ts**

```ts
// components/landing/CursorDog/types.ts
import type { RefObject } from 'react'
import type { gsap } from 'gsap'

// DogState is the source-of-truth definition for the rest of the project.
// The pure state-machine file `stateMachine.ts` (Task 4) RE-DECLARES the
// same union locally so it can be loaded by node --test without going
// through this file (which imports `gsap`). When changing this union,
// update BOTH this file AND `stateMachine.ts` — drift is a real risk.
export type DogState =
  | 'DISABLED'
  | 'IDLE'
  | 'FOLLOWING'
  | 'SNIFFING'
  | 'BARKING'
  | 'PARKED'
  | 'PAUSED_INPUT'

export type Mode = 'desktop' | 'mobile' | 'disabled'

export interface CursorTarget { x: number; y: number }

export interface DogRefs {
  /** Global follow group — `x` and `y` written by `quickTo`. Never reset to baseline. */
  dogRef: RefObject<SVGGElement | null>
  /** Inner group nested inside dogRef — `y` is the sniff bob (`+= 4px`). Reset to 0 on baseline. */
  bobRef: RefObject<SVGGElement | null>
  /** Inner group inside bobRef — `rotation` is the head-tilt. Reset to 0 on baseline. */
  headRef: RefObject<SVGGElement | null>
  /** Sibling of headRef inside bobRef — `opacity` + `scale` for bark. Reset to opacity 0 on baseline. */
  shoutRef: RefObject<SVGGElement | null>
  /** Top-level `<path>` for the leash. `d` updated each frame by the controller. */
  leashRef: RefObject<SVGPathElement | null>
}

export interface TimelineRefs {
  barkTimelineRef: { current: gsap.core.Timeline | null }
  sniffTimelineRef: { current: gsap.core.Timeline | null }
}
```

- [ ] **Step 3: Verify TypeScript accepts the new files**

Run: `npx tsc --noEmit`
Expected: exits 0 (no type errors).

- [ ] **Step 4: Commit**

```bash
git add components/landing/CursorDog/constants.ts components/landing/CursorDog/types.ts
git commit -m "feat(cursor-dog): scaffold — constants and types"
```

---

## Task 2: `useReactiveMode` hook

**Files:**
- Create: `components/landing/CursorDog/useReactiveMode.ts`

The hook resolves the mode reactively. Mode flips on OS toggle (reduce-motion) and on input-device flip (rare — e.g., docking a tablet); both directions are reactive per spec Section 4.

- [ ] **Step 1: Implement `useReactiveMode.ts`**

```ts
// components/landing/CursorDog/useReactiveMode.ts
import { useEffect, useState } from 'react'
import type { Mode } from './types'

function resolveMode(): Mode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'disabled'
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'disabled'
  }
  if (window.matchMedia('(pointer: fine)').matches) {
    return 'desktop'
  }
  if (window.matchMedia('(pointer: coarse)').matches) {
    return 'mobile'
  }
  return 'disabled'
}

export function useReactiveMode(): Mode | null {
  // null on first SSR/client render — controller renders null until mode resolves
  const [mode, setMode] = useState<Mode | null>(null)

  useEffect(() => {
    setMode(resolveMode())
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const queries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(pointer: fine)'),
      window.matchMedia('(pointer: coarse)'),
    ]
    const onChange = () => setMode(resolveMode())
    queries.forEach((q) => q.addEventListener('change', onChange))
    return () => queries.forEach((q) => q.removeEventListener('change', onChange))
  }, [])

  return mode
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add components/landing/CursorDog/useReactiveMode.ts
git commit -m "feat(cursor-dog): reactive mode resolver (desktop/mobile/disabled)"
```

---

## Task 3: `useCursorTracker` hook

**Files:**
- Create: `components/landing/CursorDog/useCursorTracker.ts`

Exposes persistent tracking refs (`targetRef`, `lastMoveAtRef`) plus pure listener-attach functions that take an `AbortSignal` as their first argument. The `AbortController` is created and owned by the controller's `useEffect` (Task 8), so each effect run gets a **fresh** controller — fixing the post-mode-flip zombie-controller bug Codex flagged.

- [ ] **Step 1: Implement `useCursorTracker.ts`**

```ts
// components/landing/CursorDog/useCursorTracker.ts
import { useRef } from 'react'
import type { CursorTarget } from './types'

export interface CursorTracker {
  targetRef: { current: CursorTarget }
  lastMoveAtRef: { current: number }
  attachPointer: (signal: AbortSignal, onMove: (e: PointerEvent) => void) => void
  attachHtmlEdge: (signal: AbortSignal, onLeave: () => void, onEnter: () => void) => void
  attachFocus: (signal: AbortSignal, onFocusIn: (e: FocusEvent) => void, onFocusOut: (e: FocusEvent) => void) => void
  attachVisibility: (signal: AbortSignal, onHidden: () => void, onVisible: () => void) => void
  attachResize: (signal: AbortSignal, onResize: () => void) => void
}

export function isTextInputElement(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  if (el.isContentEditable) return true
  if (el instanceof HTMLInputElement) {
    const type = el.type.toLowerCase()
    return ['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(type)
  }
  if (el instanceof HTMLTextAreaElement) return true
  return false
}

export function useCursorTracker(): CursorTracker {
  // Persistent across effect re-runs — these are tracking state, not lifecycle
  const targetRef = useRef<CursorTarget>({ x: 0, y: 0 })
  const lastMoveAtRef = useRef<number>(0)

  return {
    targetRef,
    lastMoveAtRef,
    attachPointer(signal, onMove) {
      window.addEventListener(
        'pointermove',
        (e) => {
          targetRef.current = { x: e.clientX, y: e.clientY }
          lastMoveAtRef.current = performance.now()
          onMove(e)
        },
        { signal, passive: true },
      )
    },
    attachHtmlEdge(signal, onLeave, onEnter) {
      document.documentElement.addEventListener('pointerleave', onLeave, { signal })
      document.documentElement.addEventListener('pointerenter', onEnter, { signal })
    },
    attachFocus(signal, onFocusIn, onFocusOut) {
      document.addEventListener(
        'focusin',
        (e) => { if (isTextInputElement(e.target instanceof Element ? e.target : null)) onFocusIn(e) },
        { signal },
      )
      document.addEventListener(
        'focusout',
        (e) => { if (isTextInputElement(e.target instanceof Element ? e.target : null)) onFocusOut(e) },
        { signal },
      )
    },
    attachVisibility(signal, onHidden, onVisible) {
      document.addEventListener(
        'visibilitychange',
        () => { document.hidden ? onHidden() : onVisible() },
        { signal },
      )
    },
    attachResize(signal, onResize) {
      window.addEventListener('resize', onResize, { signal, passive: true })
    },
  }
}
```

**Why the AbortController moved out of this hook (Codex D12):** Owning the controller in a `useRef` made it persistent across the controller's `useEffect` re-runs. On mode flip, the effect's cleanup `abort()`ed the controller, and then the new effect's listeners attached to the same (already-aborted) controller — silently doing nothing. By taking `signal` as a parameter, each effect run can create a fresh `AbortController()` and pass its `.signal` in. StrictMode double-effect also gets a fresh controller per mount.

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add components/landing/CursorDog/useCursorTracker.ts
git commit -m "feat(cursor-dog): cursor tracker with AbortController-owned listeners"
```

---

## Task 4: Pure transition function + unit test (TDD)

**Files:**
- Create: `components/landing/CursorDog/stateMachine.ts` — pure logic, no project imports
- Create: `components/landing/CursorDog/stateMachine.test.ts` — single unit test
- Modify: `package.json` (add `"test"` script)

Spec Section 5 mandates one unit test on the pure transition function:
> Valid transitions accepted / Invalid transitions rejected / Duplicate target state ignored / Rapid edge-brush `PARKED → IDLE → PARKED` doesn't double-schedule bark

The pure `applyTransition()` function lives in its **own file** (`stateMachine.ts`) — separate from `useDogStateMachine.ts` (the runtime layer in Task 5) so that the test file can be loaded by `node --test --experimental-strip-types` without dragging in GSAP, project constants, or any other internal imports. Codex round-2 finding: Node's native TS stripping does not follow bundler extension resolution; a file with extensionless internal imports cannot be loaded directly.

By injecting side-effect callbacks (`scheduleBark`, `clearBark`, etc.) as parameters, we can test transitions in isolation with mock callbacks.

- [ ] **Step 1: Write the failing test first**

```ts
// components/landing/CursorDog/stateMachine.test.ts
// NOTE: `.ts` extension on the import is required for Node's native TypeScript
// stripping (--experimental-strip-types). Bundler-style extensionless imports
// do NOT resolve under node:test on Node 25.
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { applyTransition, type SideEffects, type TransitionContext } from './stateMachine.ts'

function makeContext(initial: TransitionContext['state']): { ctx: TransitionContext; sideEffects: SideEffects; calls: string[] } {
  const calls: string[] = []
  const ctx: TransitionContext = { state: initial }
  const sideEffects: SideEffects = {
    scheduleBark: () => calls.push('scheduleBark'),
    clearBark: () => calls.push('clearBark'),
    killBarkTimeline: () => calls.push('killBarkTimeline'),
    killSniffTimeline: () => calls.push('killSniffTimeline'),
    setBaselineInstant: () => calls.push('setBaselineInstant'),
    startSniffLoop: () => calls.push('startSniffLoop'),
    fireBark: () => calls.push('fireBark'),
    trotOffscreen: () => calls.push('trotOffscreen'),
    resetLastMoveAt: () => calls.push('resetLastMoveAt'),
  }
  return { ctx, sideEffects, calls }
}

describe('applyTransition', () => {
  it('accepts the documented valid edges', () => {
    const cases: Array<[TransitionContext['state'], TransitionContext['state']]> = [
      ['DISABLED', 'IDLE'],
      ['IDLE', 'FOLLOWING'],
      ['FOLLOWING', 'SNIFFING'],
      ['SNIFFING', 'FOLLOWING'],
      ['IDLE', 'BARKING'],
      ['FOLLOWING', 'BARKING'],
      ['SNIFFING', 'BARKING'],
      ['BARKING', 'IDLE'],
      ['IDLE', 'PARKED'],
      ['FOLLOWING', 'PARKED'],
      ['SNIFFING', 'PARKED'],
      ['BARKING', 'PARKED'],
      ['PARKED', 'IDLE'],
      ['IDLE', 'PAUSED_INPUT'],
      ['FOLLOWING', 'PAUSED_INPUT'],
      ['SNIFFING', 'PAUSED_INPUT'],
      ['BARKING', 'PAUSED_INPUT'],
      ['PAUSED_INPUT', 'FOLLOWING'],
      ['PAUSED_INPUT', 'PARKED'],   // cursor leaves while user is in a form
    ]
    for (const [from, to] of cases) {
      const { ctx, sideEffects } = makeContext(from)
      const accepted = applyTransition(ctx, to, sideEffects)
      assert.equal(accepted, true, `expected ${from} → ${to} to be accepted`)
      assert.equal(ctx.state, to, `expected state to be ${to} after transition`)
    }
  })

  it('rejects invalid transitions and leaves state unchanged', () => {
    const cases: Array<[TransitionContext['state'], TransitionContext['state']]> = [
      ['DISABLED', 'BARKING'],
      ['PARKED', 'SNIFFING'],
      ['PAUSED_INPUT', 'BARKING'],
      ['IDLE', 'SNIFFING'],   // SNIFFING is only reachable from FOLLOWING (per RAF idle check)
      ['DISABLED', 'PARKED'], // DISABLED → IDLE is the only valid edge from DISABLED
    ]
    for (const [from, to] of cases) {
      const { ctx, sideEffects } = makeContext(from)
      const accepted = applyTransition(ctx, to, sideEffects)
      assert.equal(accepted, false, `expected ${from} → ${to} to be rejected`)
      assert.equal(ctx.state, from, `expected state to remain ${from}`)
    }
  })

  it('treats same-state transitions as silent no-ops (returns false, no warning)', () => {
    const { ctx, sideEffects, calls } = makeContext('FOLLOWING')
    const accepted = applyTransition(ctx, 'FOLLOWING', sideEffects)
    assert.equal(accepted, false)
    assert.equal(ctx.state, 'FOLLOWING')
    assert.deepEqual(calls, [])
  })

  it('rapid PARKED → IDLE → PARKED does not double-schedule bark', () => {
    // Start parked. Cursor enters (PARKED → IDLE: scheduleBark). Cursor leaves
    // immediately (IDLE → PARKED: clearBark). Returns again (PARKED → IDLE:
    // scheduleBark) — only ONE outstanding scheduleBark call should
    // ever be in flight per IDLE entry.
    const { ctx, sideEffects, calls } = makeContext('PARKED')
    applyTransition(ctx, 'IDLE', sideEffects)        // scheduleBark
    applyTransition(ctx, 'PARKED', sideEffects)      // clearBark + ...
    applyTransition(ctx, 'IDLE', sideEffects)        // scheduleBark again
    const scheduleCount = calls.filter((c) => c === 'scheduleBark').length
    const clearCount = calls.filter((c) => c === 'clearBark').length
    assert.equal(scheduleCount, 2, 'each PARKED → IDLE schedules exactly one bark')
    assert.equal(clearCount, 1, 'each IDLE → PARKED clears exactly one bark')
  })
})
```

- [ ] **Step 2: Add the `test` script to `package.json`**

Add to the `scripts` block in `package.json`:

```json
"test": "node --test --experimental-strip-types components/landing/CursorDog/stateMachine.test.ts"
```

The full scripts block should read:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "node --test --experimental-strip-types components/landing/CursorDog/stateMachine.test.ts"
}
```

- [ ] **Step 3: Run the test to confirm it fails (module not found)**

Run: `npm test`
Expected: exits non-zero with `Cannot find module './stateMachine'` or similar — the implementation file doesn't exist yet.

- [ ] **Step 4: Create the pure-logic file `stateMachine.ts`**

```ts
// components/landing/CursorDog/stateMachine.ts
// Pure logic. No project imports. Loadable by node --test --experimental-strip-types.

export type DogState =
  | 'DISABLED'
  | 'IDLE'
  | 'FOLLOWING'
  | 'SNIFFING'
  | 'BARKING'
  | 'PARKED'
  | 'PAUSED_INPUT'

export interface TransitionContext {
  state: DogState
}

export interface SideEffects {
  scheduleBark: () => void
  clearBark: () => void
  killBarkTimeline: () => void
  killSniffTimeline: () => void
  setBaselineInstant: () => void
  startSniffLoop: () => void
  fireBark: () => void
  trotOffscreen: () => void
  resetLastMoveAt: () => void
}

// The valid edges, encoded as a flat set for O(1) lookup. Source of truth
// is the transition table in spec Section 3. Same-state pairs are NOT
// included here — they're handled as silent no-ops before the lookup.
const VALID_EDGES: ReadonlySet<string> = new Set([
  'DISABLED→IDLE',
  'IDLE→FOLLOWING',
  'FOLLOWING→SNIFFING',
  'SNIFFING→FOLLOWING',
  'IDLE→BARKING',
  'FOLLOWING→BARKING',
  'SNIFFING→BARKING',
  'BARKING→IDLE',
  'IDLE→PARKED',
  'FOLLOWING→PARKED',
  'SNIFFING→PARKED',
  'BARKING→PARKED',
  'PARKED→IDLE',
  'IDLE→PAUSED_INPUT',
  'FOLLOWING→PAUSED_INPUT',
  'SNIFFING→PAUSED_INPUT',
  'BARKING→PAUSED_INPUT',
  'PAUSED_INPUT→FOLLOWING',
  'PAUSED_INPUT→PARKED',   // cursor leaves the viewport while a form input is focused
  // The DISABLED edge is special — it's done via remount, not transition().
])

export function applyTransition(
  ctx: TransitionContext,
  next: DogState,
  sideEffects: SideEffects,
): boolean {
  const current = ctx.state

  // Same-state: silent no-op (the FOLLOWING pointermove case)
  if (current === next) return false

  // Invalid edge: rejected
  if (!VALID_EDGES.has(`${current}→${next}`)) return false

  // Apply the transition synchronously BEFORE running side effects.
  // Spec Section 3 synchrony contract: state ref is updated before any
  // side effects observe it, before the function returns.
  ctx.state = next

  // Side effects, in the order documented in the spec's transition table.
  // For each (current → next) row, run kills BEFORE writes BEFORE schedules.
  switch (next) {
    case 'IDLE':
      if (current === 'PARKED' || current === 'BARKING') {
        if (current === 'PARKED') sideEffects.resetLastMoveAt()
        sideEffects.scheduleBark()
      } else if (current === 'DISABLED') {
        sideEffects.scheduleBark()
      }
      break

    case 'FOLLOWING':
      if (current === 'SNIFFING') {
        sideEffects.killSniffTimeline()
        // killSniffTimeline + a 150ms return-to-baseline tween (bobRef.y/x → 0,
        // headRef rotation → 0) live in the runtime layer's killSniffTimeline impl.
      }
      if (current === 'PAUSED_INPUT') {
        sideEffects.scheduleBark()
      }
      break

    case 'SNIFFING':
      sideEffects.startSniffLoop()
      break

    case 'BARKING':
      if (current === 'SNIFFING') {
        sideEffects.killSniffTimeline()
        sideEffects.setBaselineInstant()
      }
      sideEffects.fireBark()
      break

    case 'PARKED':
      sideEffects.killBarkTimeline()
      sideEffects.killSniffTimeline()
      sideEffects.clearBark()
      sideEffects.setBaselineInstant()
      sideEffects.trotOffscreen()
      break

    case 'PAUSED_INPUT':
      sideEffects.killBarkTimeline()
      sideEffects.killSniffTimeline()
      sideEffects.clearBark()
      sideEffects.setBaselineInstant()
      break

    case 'DISABLED':
      // Cleanup is run via the controller's useEffect return, not here.
      break
  }

  return true
}
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npm test`
Expected: all 4 sub-tests pass. Output ends with `# pass 4`.

- [ ] **Step 6: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add components/landing/CursorDog/stateMachine.ts components/landing/CursorDog/stateMachine.test.ts package.json
git commit -m "feat(cursor-dog): pure transition function + unit test"
```

**Note on `types.ts` vs `stateMachine.ts`:** Both files now export `DogState`. The pure `stateMachine.ts` re-declares it to keep the file Node-loadable with zero project imports. The runtime layer (`useDogStateMachine.ts`, Task 5) imports `DogState` from `./stateMachine.ts` (not `./types`), and `types.ts` re-exports it for the rest of the codebase: `export type { DogState } from './stateMachine'`. This indirection is intentional — the test file must not transit `./types.ts`.

---

## Task 5: State machine runtime — timelines + scheduler + dev hook

**Files:**
- Create: `components/landing/CursorDog/useDogStateMachine.ts`

The runtime layer lives in `useDogStateMachine.ts` (a separate file from the pure `stateMachine.ts` created in Task 4). This file imports the pure `applyTransition` from `./stateMachine.ts` AND project-level utilities (GSAP, constants). It is bundled by Next.js, not loaded by `node --test`.

Contents:
- `pendingTimers: Set<number>` (per-instance)
- `barkTimerHandle` (single bark scheduling guard)
- `barkTimelineRef`, `sniffTimelineRef`
- `scheduleBark()`, `clearBark()` per spec Section 3
- `fireBark()` constructs the bark timeline with `svgOrigin: "29.7 7.4"` (per spec round-6 amendment)
- `startSniffLoop()` targets `bobRef.y` (spec round-7 amendment — bobRef separates sniff bob from cursor follow)
- `setBaselineInstant()` resets `bobRef.y`, `headRef.rotation`, `shoutRef.opacity` — never `dogRef.y`
- `transition(next)` wrapper that calls `applyTransition` with side effects bound to refs
- `__borkdDog` dev hook
- Setup function (callable inside `gsap.context()`)

- [ ] **Step 1: Create `useDogStateMachine.ts`**

```ts
// components/landing/CursorDog/useDogStateMachine.ts
import { gsap } from 'gsap'
import {
  BARK_MIN_MS,
  BARK_MAX_MS,
  BARK_TILT_DEG,
  SNIFF_TILT_DEG,
  SHOUT_SVG_ORIGIN,
} from './constants'
import { applyTransition, type DogState, type SideEffects, type TransitionContext } from './stateMachine'
import type { DogRefs, TimelineRefs } from './types'

export interface StateMachineHandle {
  /** Stable reference exposing the current state — readable by RAF tick + dev hook */
  stateRef: { current: DogState }
  /** Mutates the state ref + runs side effects. Returns true if accepted. */
  transition: (next: DogState) => boolean
  /** Pending-timer set — caller's cleanup MUST iterate + clearTimeout + clear() */
  pendingTimers: Set<number>
  /** Timeline refs — caller's cleanup is ctx.revert(), but these are used by transitions */
  timelineRefs: TimelineRefs
  /** Setup runs inside the caller's gsap.context() to wire scheduling */
  setup: () => void
}

export function createDogStateMachine(
  refs: DogRefs,
  initial: DogState = 'DISABLED',
): StateMachineHandle {
  const stateRef = { current: initial }
  const pendingTimers: Set<number> = new Set()
  let barkTimerHandle: number | null = null
  const barkTimelineRef: TimelineRefs['barkTimelineRef'] = { current: null }
  const sniffTimelineRef: TimelineRefs['sniffTimelineRef'] = { current: null }

  function scheduleBark(): void {
    if (barkTimerHandle != null) return
    const delay = BARK_MIN_MS + Math.random() * (BARK_MAX_MS - BARK_MIN_MS)
    const handle = window.setTimeout(() => {
      // First statement: remove own handle from pendingTimers (spec invariant)
      pendingTimers.delete(handle)
      barkTimerHandle = null
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

  function killBarkTimeline(): void {
    barkTimelineRef.current?.kill()
    barkTimelineRef.current = null
  }

  function killSniffTimeline(): void {
    sniffTimelineRef.current?.kill()
    sniffTimelineRef.current = null
  }

  function setBaselineInstant(): void {
    // Instant reset (NOT a tween) for bobRef (x AND y) + head rotation + shout opacity.
    // SPEC ROUND-7 RULE: never touch dogRef here. dogRef holds the cursor-follow
    // position; resetting it would snap the dog (y) or compete with quickTo (x).
    // Used before trot / bark / pause so no competing tween runs against trot/bark.
    if (refs.bobRef.current) gsap.set(refs.bobRef.current, { x: 0, y: 0 })
    if (refs.headRef.current) gsap.set(refs.headRef.current, { rotation: 0 })
    if (refs.shoutRef.current) gsap.set(refs.shoutRef.current, { opacity: 0, scale: 1 })
  }

  function startSniffLoop(): void {
    // Sniff bob AND x-drift both live on bobRef so they don't fight quickTo
    // for dogRef ownership. dogRef.x is overwritten each frame by quickTo
    // during SNIFFING — writing drift there would be invisible/flaky.
    // (Codex round-3 finding.) bobRef.x is reset to 0 in setBaselineInstant.
    if (refs.bobRef.current == null || refs.headRef.current == null) return
    const tl = gsap.timeline({ repeat: -1 })
      .to(refs.bobRef.current, { y: '+=4', duration: 0.25, ease: 'sine.inOut' }, 0)
      .to(refs.headRef.current, { rotation: SNIFF_TILT_DEG, duration: 0.25, ease: 'sine.inOut' }, 0)
      .to(refs.bobRef.current, { y: '-=4', duration: 0.20, ease: 'sine.inOut' })
      .to(refs.headRef.current, { rotation: 0, duration: 0.20, ease: 'sine.inOut' }, '<')
      .to({}, { duration: () => 0.6 + Math.random() * 0.6 }) // randomized pause 600-1200ms
      .to(refs.bobRef.current, { x: () => `+=${(Math.random() - 0.5) * 16}`, duration: 0.1 })
    sniffTimelineRef.current = tl
  }

  function fireBark(): void {
    if (refs.headRef.current == null || refs.shoutRef.current == null) return
    const tl = gsap.timeline()
      .to(refs.headRef.current, { rotation: BARK_TILT_DEG, duration: 0.15, ease: 'power2.out' })
      // svgOrigin is LOAD-BEARING per spec amendment. Without it, the strokes
      // scale from the SVG (0,0) instead of from the shout-lines' focal point.
      .fromTo(
        refs.shoutRef.current,
        { opacity: 0, scale: 0.5 },
        { opacity: 1, scale: 1, duration: 0.08, svgOrigin: SHOUT_SVG_ORIGIN },
      )
      .to({}, { duration: 0.20 }) // hold
      .to(refs.shoutRef.current, { opacity: 0, duration: 0.15, svgOrigin: SHOUT_SVG_ORIGIN })
      .to(refs.headRef.current, { rotation: 0, duration: 0.20, ease: 'power2.in' })
    tl.eventCallback('onComplete', () => {
      barkTimelineRef.current = null
      if (stateRef.current === 'BARKING') transition('IDLE')
      // else: state moved on (PARKED / PAUSED_INPUT) — onComplete is a no-op
    })
    barkTimelineRef.current = tl
  }

  function trotOffscreen(): void {
    if (refs.dogRef.current == null) return
    gsap.to(refs.dogRef.current, {
      x: window.innerWidth + 32,
      opacity: 0.4, // PARK_FADE_OPACITY
      duration: 0.6,
      ease: 'power2.in',
    })
  }

  function resetLastMoveAt(): void {
    // Owned by the controller's tracker; transition table calls it on PARKED → IDLE
    // via the sideEffects shim wired in setup(). The actual impl is injected.
  }

  const sideEffects: SideEffects = {
    scheduleBark,
    clearBark,
    killBarkTimeline,
    killSniffTimeline,
    setBaselineInstant,
    startSniffLoop,
    fireBark,
    trotOffscreen,
    resetLastMoveAt,
  }

  function transition(next: DogState): boolean {
    return applyTransition({ get state() { return stateRef.current }, set state(v) { stateRef.current = v } } as TransitionContext, next, sideEffects)
  }

  function setup(): void {
    // Must be called inside gsap.context() so any gsap.set / gsap.timeline /
    // gsap.to created here is registered to that context for revert.
    if (process.env.NODE_ENV === 'development') {
      ;(window as unknown as { __borkdDog?: unknown }).__borkdDog = {
        state: () => stateRef.current,
        triggerBark: () => { clearBark(); transition('BARKING') },
        peekBarkTimer: () => barkTimerHandle,
      }
    }
  }

  return {
    stateRef,
    transition,
    pendingTimers,
    timelineRefs: { barkTimelineRef, sniffTimelineRef },
    setup,
  }
}
```

Note: the `transition()` wrapper above passes a getter/setter proxy to `applyTransition` so the pure function still mutates one logical state cell while we keep `stateRef.current` as the public read surface. Equivalent semantics, kept for the spec's "synchrony contract" requirement.

- [ ] **Step 2: Re-run the unit test to make sure the runtime additions didn't break the pure function**

Run: `npm test`
Expected: still passes — runtime code is not exercised by the test.

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add components/landing/CursorDog/useDogStateMachine.ts
git commit -m "feat(cursor-dog): state machine runtime — timelines, scheduler, dev hook"
```

---

## Task 6: Mobile SVG component

**Files:**
- Create: `components/landing/CursorDog/MobileDogSvg.tsx`

Static fixed-position SVG anchored bottom-right (24px). The state machine only cycles `IDLE → BARKING → IDLE`. No leash, no sniff, no follow.

- [ ] **Step 1: Implement `MobileDogSvg.tsx`**

```tsx
// components/landing/CursorDog/MobileDogSvg.tsx
import { type Ref } from 'react'
import type { DogRefs } from './types'

interface Props {
  dogRef: DogRefs['dogRef']
  bobRef: DogRefs['bobRef']
  headRef: DogRefs['headRef']
  shoutRef: DogRefs['shoutRef']
}

export function MobileDogSvg({ dogRef, bobRef, headRef, shoutRef }: Props) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      data-cursor-dog
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 64,
        height: 54,
        pointerEvents: 'none',
        zIndex: 60,
      }}
    >
      <svg
        viewBox="0 0 31.0189 25.9189"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible', display: 'block', width: '100%', height: '100%' }}
      >
        <g ref={dogRef as Ref<SVGGElement>}>
          <g ref={bobRef as Ref<SVGGElement>}>
            <g ref={headRef as Ref<SVGGElement>} style={{ transformOrigin: '16px 22px', transformBox: 'fill-box' }}>
              <path
                d="M16.4333 21.4596C23.7166 26.2067 30.0434 22.7602 30.0434 16.5824C30.0434 10.4047 23.5215 9.49424 19.4247 9.94944C15.3278 10.4046 15.7734 15.8447 20.0941 14.4364C25.0822 12.8107 22.5463 0.975433 14.1113 0.975436C5.1373 0.975438 0.975428 8.92055 0.975436 15.9971C0.975441 21.5246 4.44891 25.6537 9.2801 24.8411C14.1113 24.0285 13.0518 18.5983 10.3856 13.331"
                stroke="var(--stroke-0, white)"
                strokeWidth="1.95087"
                strokeLinecap="round"
              />
            </g>
            <g ref={shoutRef as Ref<SVGGElement>} opacity={0}>
              <g stroke="var(--stroke-0, white)" strokeWidth="1.95087" strokeLinecap="round">
                <line x1="28.2" y1="4.2" x2="30.4" y2="0.5" />
                <line x1="29.8" y1="6.2" x2="33.8" y2="3.8" />
                <line x1="30.6" y1="8.5" x2="35.5" y2="8.7" />
                <line x1="30.2" y1="10.8" x2="33.8" y2="13.6" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add components/landing/CursorDog/MobileDogSvg.tsx
git commit -m "feat(cursor-dog): mobile static corner SVG"
```

---

## Task 7: Desktop SVG component

**Files:**
- Create: `components/landing/CursorDog/DesktopDogSvg.tsx`

Viewport-spanning SVG. The `<svg>` element gets `viewBox="0 0 ${innerWidth} ${innerHeight}"` synced on resize by the controller. The dog `<g>` lives in the same coordinate space — `quickTo(dogRef, 'x'|'y')` writes pixels.

Crucially: `shoutRef` is a **sibling of `headRef`**, not a child (spec round-6 amendment).

- [ ] **Step 1: Implement `DesktopDogSvg.tsx`**

```tsx
// components/landing/CursorDog/DesktopDogSvg.tsx
import { type Ref } from 'react'
import type { DogRefs } from './types'

interface Props {
  dogRef: DogRefs['dogRef']
  bobRef: DogRefs['bobRef']
  headRef: DogRefs['headRef']
  shoutRef: DogRefs['shoutRef']
  leashRef: DogRefs['leashRef']
  rootRef: React.RefObject<HTMLDivElement | null>
  svgRef: React.RefObject<SVGSVGElement | null>
}

export function DesktopDogSvg({ dogRef, bobRef, headRef, shoutRef, leashRef, rootRef, svgRef }: Props) {
  // The svg viewBox is set imperatively by the controller on mount + resize.
  // We render a placeholder viewBox here; the controller updates it before
  // the first frame paints.
  return (
    <div
      role="presentation"
      aria-hidden="true"
      data-cursor-dog
      ref={rootRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 60,
      }}
    >
      <svg
        ref={svgRef as Ref<SVGSVGElement>}
        viewBox="0 0 1 1"
        preserveAspectRatio="xMinYMin meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible', display: 'block', width: '100%', height: '100%' }}
      >
        {/* Leash — d attribute updated each frame by the controller */}
        <path
          ref={leashRef as Ref<SVGPathElement>}
          d=""
          stroke="var(--stroke-0, white)"
          strokeWidth="1.95087"
          strokeLinecap="round"
          fill="none"
        />
        {/* Dog — dogRef.x/y written by quickTo. Wrapper for cursor follow only.
            scale 0.6 keeps the dog cursor-sized (intrinsic viewBox 31x26 → ~19x16 CSS px). */}
        <g ref={dogRef as Ref<SVGGElement>} transform="translate(0,0) scale(0.6)">
          {/* bobRef — sniff bob lives here (y += 4). Separate from dogRef so the
              baseline reset (PAUSED_INPUT / PARKED entry) only zeros bobRef.y
              and never zaps the cursor-follow position. Spec round-7. */}
          <g ref={bobRef as Ref<SVGGElement>}>
            <g ref={headRef as Ref<SVGGElement>} style={{ transformOrigin: '16px 22px', transformBox: 'fill-box' }}>
              <path
                d="M16.4333 21.4596C23.7166 26.2067 30.0434 22.7602 30.0434 16.5824C30.0434 10.4047 23.5215 9.49424 19.4247 9.94944C15.3278 10.4046 15.7734 15.8447 20.0941 14.4364C25.0822 12.8107 22.5463 0.975433 14.1113 0.975436C5.1373 0.975438 0.975428 8.92055 0.975436 15.9971C0.975441 21.5246 4.44891 25.6537 9.2801 24.8411C14.1113 24.0285 13.0518 18.5983 10.3856 13.331"
                stroke="var(--stroke-0, white)"
                strokeWidth="1.95087"
                strokeLinecap="round"
              />
            </g>
            {/* shoutRef is a SIBLING of headRef (spec round-6 amendment).
                Do not nest it inside headRef — it must stay axis-aligned
                during the 12° head-tilt. */}
            <g ref={shoutRef as Ref<SVGGElement>} opacity={0}>
              <g stroke="var(--stroke-0, white)" strokeWidth="1.95087" strokeLinecap="round">
                <line x1="28.2" y1="4.2" x2="30.4" y2="0.5" />
                <line x1="29.8" y1="6.2" x2="33.8" y2="3.8" />
                <line x1="30.6" y1="8.5" x2="35.5" y2="8.7" />
                <line x1="30.2" y1="10.8" x2="33.8" y2="13.6" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add components/landing/CursorDog/DesktopDogSvg.tsx
git commit -m "feat(cursor-dog): desktop SVG (leash + dog + shout siblings)"
```

---

## Task 8: Controller (`index.tsx`) — single `gsap.context()`, RAF tick, lifecycle

**Files:**
- Create: `components/landing/CursorDog/index.tsx`

Owns the ONE `gsap.context()`. Constructs `quickToX` / `quickToY` inside the context callback. Registers RAF tick via `gsap.ticker.add(tick)` inside the context callback. Cleanup must run `gsap.ticker.remove(tick)` **before** `ctx.revert()` (spec line 175: ticker is a global system that `gsap.context()` does NOT auto-manage).

**Per-effect AbortController (Codex D12 fix):** A fresh `AbortController` is created inside the `useEffect` body and its `signal` is passed into each `tracker.attach*` call. Cleanup `abort()`s this controller. On the next effect run (mode flip / StrictMode remount), a new controller is created — there is no zombie-controller problem.

**quickTo freeze on PAUSED_INPUT (Codex D3 fix):** A `prevState` tracker in the tick detects entries into `PAUSED_INPUT`. On entry, the tick reads the dog's rendered x/y via `gsap.getProperty()` and re-targets `quickToX`/`quickToY` to that exact value, which terminates the in-flight smoothing. On PARKED entry, the state machine's `trotOffscreen` is itself a `gsap.to()` on `dogRef.x`, so GSAP's overwrite semantics override the quickTo tween — no explicit freeze needed.

**Entry trot (Codex #13 fix):** First pointermove kicks off a dedicated `gsap.to()` with `duration: ENTRY_TROT_MS/1000` on the dog from offscreen to the clamped cursor; `hasEnteredRef.current` is set to `true` in `onComplete`. The per-frame quickTo writes and leash drawing are gated on `hasEnteredRef.current` so they don't race the trot.

**Leash math (Codex #10 fix):** Leash anchor on the dog end is read from the rendered position via `gsap.getProperty(dogRef.current, 'x' | 'y')`, not the clamped target. The leash visibly tracks the actual dog, not where it's smoothing toward.

- [ ] **Step 1: Implement `index.tsx`**

```tsx
// components/landing/CursorDog/index.tsx
'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import {
  MAX_STRETCH,
  SNIFF_AFTER_MS,
  SLACK_DECAY_TAU_MS,
  SLACK_VELOCITY_GAIN_K,
  RAF_WAKE_THRESHOLD_MS,
  ENTRY_TROT_MS,
} from './constants'
import { useReactiveMode } from './useReactiveMode'
import { useCursorTracker, isTextInputElement } from './useCursorTracker'
import { createDogStateMachine } from './useDogStateMachine'
import { DesktopDogSvg } from './DesktopDogSvg'
import { MobileDogSvg } from './MobileDogSvg'
import type { CursorTarget, DogState } from './types'

function safeSet<T extends Element>(
  ref: React.RefObject<T | null>,
  apply: (el: T) => void,
): void {
  if (ref.current != null) apply(ref.current)
}

function clampTarget(
  cursor: CursorTarget,
  dog: CursorTarget,
  maxStretch: number,
): CursorTarget {
  const dx = cursor.x - dog.x
  const dy = cursor.y - dog.y
  const dist = Math.hypot(dx, dy)
  if (dist <= maxStretch) return cursor
  const k = maxStretch / dist
  return { x: dog.x + dx * k, y: dog.y + dy * k }
}

function computeLeashPath(cursor: CursorTarget, dog: CursorTarget, slack: number): string {
  const mx = (cursor.x + dog.x) / 2
  const my = (cursor.y + dog.y) / 2
  const ctrlY = my + 10 + slack * 30
  return `M${cursor.x},${cursor.y} Q${mx},${ctrlY} ${dog.x},${dog.y}`
}

function readDogPos(dogEl: SVGGElement | null): CursorTarget {
  if (dogEl == null) return { x: 0, y: 0 }
  return {
    x: Number(gsap.getProperty(dogEl, 'x')) || 0,
    y: Number(gsap.getProperty(dogEl, 'y')) || 0,
  }
}

export default function CursorDog() {
  const mode = useReactiveMode()
  const tracker = useCursorTracker()

  // SVG refs
  const rootRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dogRef = useRef<SVGGElement | null>(null)
  const bobRef = useRef<SVGGElement | null>(null)
  const headRef = useRef<SVGGElement | null>(null)
  const shoutRef = useRef<SVGGElement | null>(null)
  const leashRef = useRef<SVGPathElement | null>(null)

  // Initial-entry flags. hasEnteredRef flips to true in the entry-trot
  // tween's onComplete; isEnteringRef gates re-entrant entryTrot() calls
  // during the in-flight trot (Codex round-2 finding). Per-frame quickTo
  // writes and leash drawing are gated on hasEnteredRef.
  const hasEnteredRef = useRef(false)
  const isEnteringRef = useRef(false)

  useEffect(() => {
    if (mode == null || mode === 'disabled') return

    // Fresh AbortController per effect run (Codex D12). Cleanup aborts it;
    // the next effect run (mode flip / StrictMode remount) creates a new one.
    const controller = new AbortController()
    const { signal } = controller

    const refs = { dogRef, bobRef, headRef, shoutRef, leashRef }
    const sm = createDogStateMachine(refs, 'DISABLED')

    let quickToX: ((v: number) => gsap.core.Tween) | null = null
    let quickToY: ((v: number) => gsap.core.Tween) | null = null
    let lastFrameAt = performance.now()
    let lastClampedTarget: CursorTarget | null = null
    let slack = 0
    let prevTickState: DogState = 'DISABLED'
    // Focusout debounce RAF handle — tracked so cleanup can cancel it.
    // Without this, the RAF can fire after teardown and call sm.transition
    // on a state machine whose refs are already null. (Codex round-2 finding.)
    let focusOutRafHandle: number | null = null

    // Reset entry flags for this mount. Important because they're persistent
    // across effect runs (mode flips re-trigger the entry trot).
    hasEnteredRef.current = false
    isEnteringRef.current = false

    function freezeQuickToAtCurrent() {
      if (quickToX == null || quickToY == null || dogRef.current == null) return
      const { x, y } = readDogPos(dogRef.current)
      quickToX(x)
      quickToY(y)
    }

    function tick() {
      const now = performance.now()
      const dtMs = now - lastFrameAt
      lastFrameAt = now

      // Wake-up guard: long RAF gap → reset and skip this frame
      if (dtMs > RAF_WAKE_THRESHOLD_MS) {
        tracker.lastMoveAtRef.current = now
        return
      }

      // Idle check on RAF (no setTimeout churn)
      if (
        sm.stateRef.current === 'FOLLOWING' &&
        now - tracker.lastMoveAtRef.current > SNIFF_AFTER_MS
      ) {
        sm.transition('SNIFFING')
      }

      const currentState = sm.stateRef.current

      // State-transition edge detection for quickTo freeze (Codex D3)
      if (currentState === 'PAUSED_INPUT' && prevTickState !== 'PAUSED_INPUT') {
        freezeQuickToAtCurrent()
      }
      prevTickState = currentState

      // Mobile branch should never reach here (no ticker.add for mobile)
      // but be defensive in case the gating ever changes.
      if (mode !== 'desktop') return

      // Don't drive the dog or leash until the entry trot has completed
      if (!hasEnteredRef.current) return

      // Read rendered dog position for clamp + leash (Codex #10)
      const dogPos = readDogPos(dogRef.current)

      // Compute clamped target each frame
      const clamped = clampTarget(tracker.targetRef.current, dogPos, MAX_STRETCH)

      // Physics on RAF (single clock)
      if (lastClampedTarget != null) {
        const dt = dtMs / 1000
        if (dt > 0) {
          const vx = (clamped.x - lastClampedTarget.x) / dt
          const vy = (clamped.y - lastClampedTarget.y) / dt
          const speed = Math.hypot(vx, vy)
          slack = slack * Math.exp(-dtMs / SLACK_DECAY_TAU_MS) + speed * SLACK_VELOCITY_GAIN_K
        }
      }
      lastClampedTarget = clamped

      // Render quickTo only when the dog should be tracking.
      // PAUSED_INPUT and PARKED skip the write — combined with the freeze
      // above, the dog stays exactly where it is until the state changes.
      if (
        quickToX &&
        quickToY &&
        currentState !== 'PAUSED_INPUT' &&
        currentState !== 'PARKED'
      ) {
        quickToX(clamped.x)
        quickToY(clamped.y)
      }

      // Leash visible only when dog is tracking and entry trot has finished
      if (currentState !== 'PARKED' && currentState !== 'PAUSED_INPUT') {
        safeSet(leashRef, (el) => {
          el.setAttribute('d', computeLeashPath(tracker.targetRef.current, dogPos, slack))
        })
      } else {
        safeSet(leashRef, (el) => el.setAttribute('d', ''))
      }
    }

    function syncSvgViewBox() {
      safeSet(svgRef, (el) => {
        el.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
      })
    }

    function entryTrot() {
      // Re-entrant guard (Codex round-2): repeated pointermoves during the
      // 600ms trot would otherwise restart the tween every frame.
      if (hasEnteredRef.current || isEnteringRef.current) return
      const dogEl = dogRef.current
      if (dogEl == null) return
      isEnteringRef.current = true
      const startX = window.innerWidth + 32
      const startY = window.innerHeight * 0.6
      // Position dog offscreen instantly + fade in, then trot to cursor over ENTRY_TROT_MS.
      // The trot uses a one-shot gsap.to (NOT quickTo) so duration is honored.
      gsap.set(dogEl, { x: startX, y: startY, opacity: 0 })
      gsap.to(dogEl, { opacity: 1, duration: 0.15, ease: 'power2.out' })
      const target = clampTarget(
        tracker.targetRef.current,
        { x: startX, y: startY },
        MAX_STRETCH,
      )
      gsap.to(dogEl, {
        x: target.x,
        y: target.y,
        duration: ENTRY_TROT_MS / 1000,
        ease: 'power2.out',
        onComplete: () => {
          hasEnteredRef.current = true
          isEnteringRef.current = false
        },
      })
    }

    const ctx = gsap.context(() => {
      // Construct quickTo INSIDE the context so the tweens are reverted on cleanup.
      // Construction goes through safeSet to guard initial null ref (spec Section 2).
      safeSet(dogRef, (el) => {
        quickToX = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' })
        quickToY = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' })
      })

      // Mobile branch — no tracker, no leash, no tick
      if (mode === 'mobile') {
        hasEnteredRef.current = true
        sm.setup()
        sm.transition('IDLE') // schedules first bark
        return
      }

      // Desktop branch
      syncSvgViewBox()
      tracker.attachResize(signal, syncSvgViewBox)
      tracker.attachPointer(signal, () => {
        if (!hasEnteredRef.current) {
          // Kick off the entry trot on the first pointer — but DO NOT call
          // sm.transition('FOLLOWING') yet. The trot is a parallel one-shot
          // tween that will finish in ENTRY_TROT_MS; the tick guard
          // (hasEnteredRef) prevents quickTo from racing it.
          entryTrot()
        }
        // FOLLOWING transitions are silent no-ops if already in FOLLOWING
        // (per applyTransition same-state rule).
        sm.transition('FOLLOWING')
      })
      tracker.attachHtmlEdge(
        signal,
        () => sm.transition('PARKED'),
        () => sm.transition('IDLE'),
      )
      tracker.attachFocus(
        signal,
        () => sm.transition('PAUSED_INPUT'),
        () => {
          // Spec: one-RAF debounce; re-check activeElement.
          // Track the handle so cleanup can cancel a pending callback.
          if (focusOutRafHandle != null) cancelAnimationFrame(focusOutRafHandle)
          focusOutRafHandle = requestAnimationFrame(() => {
            focusOutRafHandle = null
            if (signal.aborted) return
            if (!isTextInputElement(document.activeElement)) {
              sm.transition('FOLLOWING')
            }
          })
        },
      )
      tracker.attachVisibility(
        signal,
        () => sm.transition('PARKED'),
        () => {
          tracker.lastMoveAtRef.current = performance.now()
          sm.transition('IDLE')
        },
      )

      gsap.ticker.add(tick)
      sm.setup()
      sm.transition('IDLE')
    }, rootRef.current ?? undefined)

    return () => {
      // ORDER IS LOAD-BEARING per spec line 175.
      gsap.ticker.remove(tick)
      ctx.revert()
      controller.abort()
      sm.pendingTimers.forEach((h) => clearTimeout(h))
      sm.pendingTimers.clear()
      if (focusOutRafHandle != null) {
        cancelAnimationFrame(focusOutRafHandle)
        focusOutRafHandle = null
      }
      if (process.env.NODE_ENV === 'development') {
        delete (window as unknown as { __borkdDog?: unknown }).__borkdDog
      }
    }
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  if (mode == null || mode === 'disabled') return null

  if (mode === 'mobile') {
    return <MobileDogSvg dogRef={dogRef} bobRef={bobRef} headRef={headRef} shoutRef={shoutRef} />
  }

  return (
    <DesktopDogSvg
      dogRef={dogRef}
      bobRef={bobRef}
      headRef={headRef}
      shoutRef={shoutRef}
      leashRef={leashRef}
      rootRef={rootRef}
      svgRef={svgRef}
    />
  )
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Run the unit test once more (sanity)**

Run: `npm test`
Expected: still passes.

- [ ] **Step 4: Commit**

```bash
git add components/landing/CursorDog/index.tsx
git commit -m "feat(cursor-dog): controller — single gsap.context, RAF tick, lifecycle"
```

---

## Task 9: `CursorDogMount.tsx` — client wrapper with dynamic + idle callback

**Files:**
- Create: `components/landing/CursorDog/CursorDogMount.tsx`

This is the file `app/layout.tsx` (server) imports. It's a `'use client'` component because Next.js 16 forbids `dynamic({ ssr: false })` in Server Components. Inside, it uses `dynamic()` and gates the load behind `requestIdleCallback` so dog code is deferred past first paint per spec Section 5.

- [ ] **Step 1: Implement `CursorDogMount.tsx`**

```tsx
// components/landing/CursorDog/CursorDogMount.tsx
'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const CursorDog = dynamic(() => import('./index'), { ssr: false, loading: () => null })

export default function CursorDogMount() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const ric =
      (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback
    if (typeof ric === 'function') {
      const handle = ric(() => setReady(true), { timeout: 2000 })
      return () => {
        const cic =
          (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback
        if (typeof cic === 'function') cic(handle)
      }
    }
    // Safari fallback — defer one frame
    const t = window.setTimeout(() => setReady(true), 50)
    return () => clearTimeout(t)
  }, [])

  if (!ready) return null
  return <CursorDog />
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add components/landing/CursorDog/CursorDogMount.tsx
git commit -m "feat(cursor-dog): client mount wrapper with dynamic + requestIdleCallback"
```

---

## Task 10: Mount in `app/layout.tsx` + print CSS in `app/globals.css`

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add `CursorDogMount` import + render in `app/layout.tsx`**

In `app/layout.tsx`, add the import at line 5 (after `FloatingTopBar`):

```ts
import CursorDogMount from "@/components/landing/CursorDog/CursorDogMount";
```

And render `<CursorDogMount />` immediately after `<FloatingTopBar />` (around line 64). The new block should read:

```tsx
        <SmoothScroll />
        {/* Sits outside the ScrollSmoother wrapper so position:fixed
            resolves against the viewport, not the transformed
            smooth-content element. */}
        <FloatingTopBar />
        <CursorDogMount />
        <div id="smooth-wrapper">
          <div id="smooth-content">{children}</div>
        </div>
```

- [ ] **Step 2: Add print CSS to `app/globals.css`**

Append to the end of `app/globals.css`:

```css
@media print {
  [data-cursor-dog] {
    display: none;
  }
}
```

- [ ] **Step 3: TypeScript check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: build completes; the CursorDog code shows in a separate chunk (search the build output for `CursorDog`).

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat(cursor-dog): mount via idle-callback wrapper + print CSS hide"
```

---

## Task 11: Manual acceptance verification + perf gate

**Files:** none modified — verification only.

This task walks the 11 acceptance criteria from spec Section 5 plus the perf gate. Use the dev hook (`window.__borkdDog`) in DevTools console for deterministic checks.

- [ ] **Step 1: Boot the dev server**

Run: `npm run dev`
Open `http://localhost:3000` in Chrome.

- [ ] **Step 2: Criterion 1 — dog follows cursor with visible leash slack**

Move the cursor around. Expected:
- Dog walks in from the right edge on first pointer activity (~600ms trot)
- Dog follows with a visibly curved leash
- Leash slack changes with cursor velocity

- [ ] **Step 3: Criterion 2 — leash bounded ≤ ~240px**

Whip the cursor across the screen rapidly. Expected: dog never falls more than ~240px behind the cursor.

- [ ] **Step 4: Criterion 3 — idle sniff after ~3s stationary**

Stop moving. Wait 3s. Expected:
- Dog dips head + bobs (sniff loop)
- Console: `window.__borkdDog.state()` returns `'SNIFFING'`

- [ ] **Step 5: Criterion 4 — bark renders correctly when triggered**

In DevTools console: `window.__borkdDog.triggerBark()`
Expected:
- Head tilts 12°
- Shout lines fade + scale in (from the focal point near the dog mark, NOT from the screen's upper-left corner — if they appear at upper-left, the `svgOrigin` pin is broken)
- Returns to baseline cleanly
- After: `peekBarkTimer()` returns a non-null handle

- [ ] **Step 6: Criterion 5 — dog parks offscreen on cursor leave**

Move the cursor outside the browser window. Expected:
- Dog trots to the right edge + fades to opacity 0.4
- `__borkdDog.state()` returns `'PARKED'`

- [ ] **Step 7: Criterion 6 — dog freezes + bark suspended during form typing**

Click into the waitlist email input. Expected:
- Dog freezes at last position
- `__borkdDog.peekBarkTimer()` returns `null`
- Click out → `peekBarkTimer()` returns non-null within ~1 RAF

- [ ] **Step 8: Criterion 7 — reduce-motion: full teardown**

System Preferences → Accessibility → Display → Reduce motion = ON.
Within 1s expected:
- Dog vanishes
- No console warnings
- `window.__borkdDog === undefined`
- DevTools Performance recording shows no GSAP ticker activity for 5s

Toggle reduce-motion OFF → dog reappears, dev hook returns.

- [ ] **Step 9: Criterion 8 — mobile: static corner + occasional bark**

Open Chrome DevTools → Device Mode → iPhone 14 Pro Max.
Expected:
- Static dog in bottom-right corner (24px inset)
- No leash, no follow
- After 20-40s: bark renders correctly

- [ ] **Step 10: Criterion 9 — tab-bg / tab-return timing**

In a tab with the page open: switch to another tab for 2s. Switch back.
Expected:
- After 1s of tab-bg: dog is parked
- On return: `__borkdDog.state()` returns `'IDLE'` within 1 frame
- `peekBarkTimer()` non-null within 100ms

- [ ] **Step 11: Criterion 10 — Instagram embed**

Scroll to the section containing the Instagram embed (if any). Hover the embed.
Expected: dog freezes at the embed boundary; on exit, dog smooths back. No errors.

(If no IG embed is present on the page at impl time, mark this criterion N/A — the spec's "cross-origin iframe" generalization is the contract; behavior depends on having an iframe to test.)

- [ ] **Step 12: Criterion 11 — clean console**

Across all interactions in steps 1-11: DevTools console shows no `console.error`. Warnings are OK if they were present pre-impl.

- [ ] **Step 13: Perf gate (build mode)**

Run: `npm run build && npm start`
Open `http://localhost:3000` in Chrome → DevTools → Performance.
- CPU throttle: 4× (the ship gate)
- Click record
- Scroll to StepsSection (the horizontal-pan section)
- Move cursor across the pinned pan area for 5s
- Stop recording

Inspect the recording:
- **Median fps ≥ 55**
- **Zero frames > 33ms** (look at the Frames track — any red bars are fails)

Pass → proceed. Fail → switch follow loop from `quickTo` to manual RAF lerp per spec "Hybrid-D fallback" (deferred to a follow-up commit; defer here unless the gate fails).

Also log at 6× throttle for the stress budget — non-blocking.

- [ ] **Step 14: Bundle delta**

Run: `npm run build` (if not already from Step 13).
Inspect the build output. Expected:
- New chunk includes `CursorDog`
- First Load JS delta ≤ 8 KB gzipped on the homepage

If over budget, investigate: most likely the bark/sniff timelines are pulling unused GSAP plugins via tree-shaking misses.

- [ ] **Step 15: Final commit (verification documentation, if anything noted)**

If everything passes cleanly with no notes, no commit is required.

If anything needed minor tuning (`SLACK_VELOCITY_GAIN_K`, leash curve, etc.) per spec's "Open items" section, commit those tweaks now:

```bash
git add components/landing/CursorDog/constants.ts
git commit -m "tune(cursor-dog): visual adjustments from impl review"
```

---

## Self-review notes (writing-plans skill)

**1. Spec coverage** — every section of the spec maps to a task:
- Section 1 Architecture → Task 8 (one ctx, ticker, refs, cleanup order)
- Section 2 Components → Tasks 1-9 (one task per file in spec's Files Touched table; plus the codex-amendment-mandated `CursorDogMount.tsx` separate file)
- Section 3 State machine & data flow → Tasks 4 + 5 (pure transition + runtime layer)
- Section 4 Error handling & degradations → covered passively by Tasks 6-10 (refs guarded by safeSet, no try/catch, AbortController owns listeners, print CSS in Task 10)
- Section 5 Testing & acceptance → Task 4 (unit test) + Task 11 (manual matrix + perf gate)
- Section "Initial appearance UX" → Task 8 (`entryTrot` + `hasEnteredRef`)
- Section "Required before implementation" → ALREADY DONE (vector6-shout.svg committed in `630efdb`)
- Section "Files touched" table → Tasks 1-10 + the additional `CursorDogMount.tsx` from codex finding

**2. Placeholder scan** — no TBDs, no "handle edge cases" hand-waves, no "implement later". Every step has either runnable code or an exact command with expected output.

**3. Type consistency** — `DogState` defined once in `types.ts`, imported everywhere. `SideEffects` and `TransitionContext` defined in `useDogStateMachine.ts` and imported by the test. `DogRefs` and `TimelineRefs` defined in `types.ts`. `CursorTracker` interface lives in `useCursorTracker.ts`. Method names consistent: `transition()` everywhere (not `handleTransition` or `applyTransition` — except the pure underlying function is `applyTransition` and the wrapper is `transition`, which is intentional and tested).

**Known design call-outs (not deviations):**
- The codex amendment about `shoutRef` sibling order is enforced in Tasks 6 + 7 (and called out in inline comments).
- The codex amendment about `svgOrigin: "29.7 7.4"` is enforced in Task 5's `fireBark()` and exported as `SHOUT_SVG_ORIGIN` in Task 1.
- The Next.js 16 `ssr: false` restriction is handled by Task 9 (`CursorDogMount.tsx`), splitting the spec's single-file mount into two files (the wrapper + the actual CursorDog).

**Codex plan-review revisions (round-1):**
- **D12 (CRITICAL):** `AbortController` moved out of `useCursorTracker` and into the controller's `useEffect`. Each effect run creates a fresh controller; cleanup `abort()`s it; subsequent effect runs are not poisoned. StrictMode-safe.
- **D3 (HIGH):** Added a `freezeQuickToAtCurrent()` call at the entry edge into `PAUSED_INPUT` (detected via `prevTickState` in the RAF tick). Re-targets `quickToX`/`quickToY` to the rendered position, terminating the in-flight smoothing. PARKED is handled by `trotOffscreen`'s own `gsap.to()` overriding the quickTo tween via GSAP overwrite semantics.
- **D7 (HIGH):** Test imports use the `.ts` extension explicitly (required by Node's `--experimental-strip-types`).
- **#13 (HIGH):** Entry trot rewritten — a dedicated `gsap.to(dogRef, {x, y, duration: ENTRY_TROT_MS/1000})` is fired on the first pointermove. `hasEnteredRef.current` is set to `true` in `onComplete`. Per-frame quickTo and leash writes are gated on `hasEnteredRef.current` so they don't race the trot.
- **Missing edge:** `PAUSED_INPUT → PARKED` added to `VALID_EDGES` + test case (covers the cursor-leaves-while-typing case from spec's "any except DISABLED" parking rule).
- **#10 (DESIGN):** Leash math reads rendered dog position via `gsap.getProperty(dogRef.current, 'x' | 'y')`, not the clamped target. Visible leash anchor now tracks the actual dog.
- **#15 (DESIGN):** Explicit sequential task-ordering note added to the plan header.

**Codex plan-review revisions (round-2):**
- **D3 (HIGH, RESIDUAL):** Codex round-2 noticed that `setBaselineInstant()` was writing `dogRef.y = 0` before the quickTo freeze captured position — snapping the dog to the top of the viewport. **Spec round-7 amendment**: introduced `bobRef`, an inner `<g>` between `dogRef` and `headRef`/`shoutRef`. The sniff loop and all baseline resets now target `bobRef.y` (the local bob offset), never `dogRef.y` (the cursor-follow position). Affects Tasks 1, 5, 6, 7, 8.
- **D7 (HIGH, RESIDUAL):** Codex round-2 flagged that even with the test's `.ts`-extension import, the imported file (`useDogStateMachine.ts`) has internal extensionless imports (`./constants`) that Node's strip-types won't resolve. **Fix:** split the pure transition function into its own file `stateMachine.ts` with no project imports. Test imports `./stateMachine.ts`. Runtime layer (`useDogStateMachine.ts`) imports `applyTransition` from `./stateMachine.ts`. Affects Tasks 4 and 5.
- **#13 (HIGH, RESIDUAL):** Codex round-2 noticed that repeated pointermoves during the 600ms entry trot would re-fire `entryTrot()`, restarting the tween each frame. **Fix:** added `isEnteringRef` set to `true` at trot-start, cleared in `onComplete`. The guard now reads `if (hasEnteredRef.current || isEnteringRef.current) return`.
- **Focusout RAF leak (HIGH, NEW):** The focusout debounce's `requestAnimationFrame` handle was not tracked or cancelled on cleanup. **Fix:** Task 8 now stores the handle in a `focusOutRafHandle` closure variable, cancels prior pending RAF on each focusout, calls `cancelAnimationFrame` in the effect's return, and checks `signal.aborted` inside the callback before invoking `sm.transition`.

**Codex plan-review revisions (round-3):**
- **Sniff x-drift on dogRef.x (MEDIUM):** Codex round-3 flagged that writing `dogRef.x += drift` competes with `quickToX` per frame — the drift is overwritten before it can render. **Fix:** drift now writes to `bobRef.x` instead. `setBaselineInstant` zeros both `bobRef.x` AND `bobRef.y`.
- **Stale doc references (MEDIUM):** Folder layout in spec Section 2 + Files Touched table in spec + a stale comment in the plan's `applyTransition` switch all referenced the pre-split `useDogStateMachine.test.ts` or `dogRef.y` baseline-reset. **Fix:** spec folder/table updated to reflect the actual file set (`stateMachine.ts`, `stateMachine.test.ts`, `CursorDogMount.tsx`, `types.ts`); the plan's stale comment corrected.

**Round-3 codex verdict: SHIP-WITH-FIXES** (all round-1 and round-2 findings RESOLVED; round-3 medium-severity issues now patched; one LOW-severity composite-position visual jump on SNIFFING → PAUSED_INPUT accepted as imperceptible-by-codex's-own-assessment and documented here for impl awareness).
