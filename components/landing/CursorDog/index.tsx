// components/landing/CursorDog/index.tsx
'use client'

import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import {
  MAX_STRETCH,
  SNIFF_AFTER_MS,
  SLACK_DECAY_TAU_MS,
  SLACK_VELOCITY_GAIN_K,
  MAX_SLACK,
  WANDER_GATE_DELAY_MS,
  WANDER_RAMP_MS,
  WANDER_TROT_RADIUS,
  WANDER_ARRIVE_EPS,
  WANDER_HOLD_MIN_MS,
  WANDER_HOLD_MAX_MS,
  QUICKTO_DURATION,
  QUICKTO_EASE,
  TURN_SQUASH_MS,
  TURN_STRETCH_MS,
  WALK_BOB_SPEED_THRESHOLD,
  WALK_BOB_SPEED_CAP,
  WALK_BOB_MAX_AMPLITUDE,
  WALK_BOB_FREQUENCY_HZ,
  RAF_WAKE_THRESHOLD_MS,
  MORPH_EMOJI_SIZE_PX,
  MORPH_EMOJI_GAP_PX,
} from './constants'
import { useReactiveMode } from './useReactiveMode'
import { useCursorTracker, isTextInputElement } from './useCursorTracker'
import { createDogStateMachine } from './useDogStateMachine'
import { DesktopDogSvg } from './DesktopDogSvg'
import { MobileDogSvg } from './MobileDogSvg'
import {
  nextWanderState,
  initialWanderState,
  resetWanderState,
  type WanderConfig,
  type WanderState,
} from './wanderPhases'
import type { CursorTarget, DogState } from './types'

const WANDER_CONFIG: WanderConfig = {
  trotRadius: WANDER_TROT_RADIUS,
  arriveEps: WANDER_ARRIVE_EPS,
  holdMinMs: WANDER_HOLD_MIN_MS,
  holdMaxMs: WANDER_HOLD_MAX_MS,
}

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

// While MORPHED, the emoji's y is pinned above the hovered word's TOP edge (its
// x still follows the cursor) so the word is never covered, regardless of word
// height or where in the word the pointer sits. The emoji layer has no vertical
// margin, so this returns the translate-y that puts the emoji's TOP at
// `wordTop - GAP - SIZE` → its bottom lands GAP px above the word.
//
// No top clamp on purpose: clamping y to keep the glyph fully onscreen would,
// for a word within SIZE+GAP px of the viewport top, push the emoji back DOWN
// onto the word — which is exactly the thing we must never do (Codex). Not
// covering the hovered word is the hard requirement; the glyph going partly
// offscreen is the acceptable trade. (In practice every [data-emoji] word here
// sits well below the fixed header, so this only matters defensively.)
function morphEmojiY(el: HTMLElement | null): number {
  if (el == null) return 0
  return el.getBoundingClientRect().top - MORPH_EMOJI_GAP_PX - MORPH_EMOJI_SIZE_PX
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
  // Emoji-morph refs. svgLayerRef wraps the SVG dog+leash (faded on morph);
  // emojiRef is the DOM emoji node (sibling, stays visible — Codex #8).
  const svgLayerRef = useRef<HTMLDivElement | null>(null)
  const emojiRef = useRef<HTMLDivElement | null>(null)

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
    // Hide/restore the native cursor during MORPHED. Scoped to a body class so
    // the rule lives in CSS (no inline-style war with other code) and is trivial
    // to force-clear on teardown. Desktop-only is already guaranteed: this whole
    // effect bails for non-'desktop' mode (Codex #10).
    const setNativeCursorHidden = (hidden: boolean) => {
      document.body.classList.toggle('borkd-cursor-hidden', hidden)
    }
    const morphDeps = { svgLayerRef, emojiRef, setNativeCursorHidden }
    const sm = createDogStateMachine(refs, morphDeps, 'DISABLED')

    let quickToX: ((v: number) => gsap.core.Tween) | null = null
    let quickToY: ((v: number) => gsap.core.Tween) | null = null
    // Emoji follows the cursor 1:1 while MORPHED. Snappier than the dog's
    // quickTo (the emoji IS the cursor, so it shouldn't lag).
    let emojiQuickToX: ((v: number) => gsap.core.Tween) | null = null
    let emojiQuickToY: ((v: number) => gsap.core.Tween) | null = null
    // The [data-emoji] element currently hovered (drives MORPHED). Cleared on
    // pointerout, or when it disconnects / no longer matches (Codex #9).
    let activeMorphEl: HTMLElement | null = null
    let lastFrameAt = performance.now()
    let lastClampedTarget: CursorTarget | null = null
    let slack = 0
    let prevTickState: DogState = 'DISABLED'
    let currentFacing: 1 | -1 = 1   // 1 = facing right, -1 = facing left
    let turning = false             // gate during the 2-stage squash/stretch so we don't restack tweens mid-flip
    const FLIP_DEADZONE = 12        // px — hysteresis to prevent flip-flop when cursor is near dog.x
    // Walking-bob amplitude smoothed across frames so it doesn't pop on/off
    // when speed crosses the threshold. Lerps toward target each frame; the
    // sniff timeline owns bob.y while SNIFFING so we leave it alone there.
    let bobAmplitude = 0
    let walkBobOwned = false        // true while we're driving bob.y, so we know to release it cleanly
    // Lively idle-wander FSM state. Positional only — never touches the dog
    // state machine. Reset the frame cursor motion resumes (wanderGain → 0) so a
    // stale target near the old cursor can't keep pulling the dog (Codex #13).
    let wanderState: WanderState = initialWanderState()
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

    // Single owner of activeMorphEl + the word's hover treatment class, so the
    // class can never desync from the tracked element (it's cleared from
    // pointerout, the in-tick recovery guard, and the MORPHED-exit safety in the
    // tick). Passing null removes the class from the previously-active element.
    function setActiveMorphEl(el: HTMLElement | null) {
      if (activeMorphEl === el) return
      activeMorphEl?.classList.remove('borkd-emoji-active')
      activeMorphEl = el
      activeMorphEl?.classList.add('borkd-emoji-active')
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

      // State-transition edge detection for quickTo freeze (Codex D3).
      // Freeze on PAUSED_INPUT entry AND on MORPHED entry: while morphed the
      // SVG dog is hidden and the emoji IS the cursor, so the dog must NOT keep
      // tracking underneath (Codex Stage-2 #3) — it should reappear exactly
      // where it morphed. Freezing quickTo at the current dog position pins it
      // there for the duration of the morph.
      const freezeStates: DogState[] = ['PAUSED_INPUT', 'MORPHED']
      if (freezeStates.includes(currentState) && !freezeStates.includes(prevTickState)) {
        freezeQuickToAtCurrent()
      }
      prevTickState = currentState

      // Mobile branch should never reach here (no ticker.add for mobile)
      if (mode !== 'desktop') return

      // Don't drive the dog or leash until the entry trot has completed
      if (!hasEnteredRef.current) return

      // Read rendered dog position for clamp + leash (Codex #10)
      const dogPos = readDogPos(dogRef.current)

      // Wander gain — 0 while cursor is moving, ramps 0→1 over WANDER_RAMP_MS
      // after the cursor has been still for WANDER_GATE_DELAY_MS. Drops back to
      // 0 immediately on any new cursor motion (a slow fade-out would leave the
      // dog wobbling for half a second after the user has clearly started
      // moving again, which reads as "drunk dog").
      const stillFor = now - tracker.lastMoveAtRef.current
      const wanderGain =
        stillFor <= WANDER_GATE_DELAY_MS
          ? 0
          : Math.min(1, (stillFor - WANDER_GATE_DELAY_MS) / WANDER_RAMP_MS)

      // The dog targets a wandering point near the cursor (rather than the
      // cursor itself), so it explores instead of overlapping the cursor.
      // During FOLLOWING/SNIFFING the wander applies; during BARKING the dog
      // freezes mid-stride so the bark reads as "barking AT something" rather
      // than "barking while walking through" — quickTo target stays at the
      // current dog position, no new motion.
      //
      // The lively wander FSM (wanderPhases.ts) decides where the dog wants to
      // trot. We blend that target toward the cursor by wanderGain so cursor
      // motion always wins: gain 0 → track cursor (and reset the FSM so a stale
      // target can't pull the dog, Codex #13); gain 1 → full trot target.
      let followTarget: CursorTarget
      const cursor = tracker.targetRef.current
      if (currentState === 'BARKING') {
        followTarget = dogPos
      } else if (wanderGain <= 0) {
        wanderState = resetWanderState()
        followTarget = cursor
      } else {
        wanderState = nextWanderState(wanderState, dogPos, cursor, now, Math.random, WANDER_CONFIG)
        const wt = wanderState.target ?? cursor
        followTarget = {
          x: cursor.x + (wt.x - cursor.x) * wanderGain,
          y: cursor.y + (wt.y - cursor.y) * wanderGain,
        }
      }

      // Compute clamped target each frame (clamp keeps the dog within MAX_STRETCH
      // of the cursor — the wander offset is naturally capped by the clamp).
      const clamped = clampTarget(followTarget, dogPos, MAX_STRETCH)

      // Direction flip — 2-stage squash/stretch so the dog reads as physically
      // turning instead of mirror-flipping. Phase 1 squashes scaleX → 0 (edge-on);
      // phase 2 stretches back to ±1 in the new direction. `turning` gates the
      // tick so we don't restack tweens mid-flip if the cursor keeps crossing
      // the deadzone. Hysteresis (deadzone) prevents flip-flop near dog.x.
      const cursorDx = tracker.targetRef.current.x - dogPos.x
      let desiredFacing: 1 | -1 = currentFacing
      if (Math.abs(cursorDx) > FLIP_DEADZONE) {
        desiredFacing = cursorDx < 0 ? -1 : 1
      }
      if (desiredFacing !== currentFacing && !turning) {
        currentFacing = desiredFacing
        if (bobRef.current) {
          turning = true
          const el = bobRef.current
          // ctx.add() captures this timeline so ctx.revert() in cleanup
          // kills it. Without that capture, a turn-in-flight at unmount
          // (or during the StrictMode double-mount) keeps running on a
          // detached SVG node — a real leak Codex flagged.
          ctx.add(() => {
            gsap.timeline({
              onComplete: () => { turning = false },
            })
              .to(el, { scaleX: 0, duration: TURN_SQUASH_MS, ease: 'power2.in' })
              .to(el, { scaleX: desiredFacing, duration: TURN_STRETCH_MS, ease: 'back.out(1.4)' })
          })
        }
      }

      // Physics on RAF (single clock)
      let speed = 0
      if (lastClampedTarget != null) {
        const dt = dtMs / 1000
        if (dt > 0) {
          const vx = (clamped.x - lastClampedTarget.x) / dt
          const vy = (clamped.y - lastClampedTarget.y) / dt
          speed = Math.hypot(vx, vy)
          // Clamp slack to defend against cursor teleport (display sleep / automation
          // tools / dock unhide) which generates spike velocities the EMA can't decay
          // back fast enough — without this clamp the leash control-point Y could
          // land thousands of pixels off-screen, drawing a giant vertical line.
          slack = Math.min(
            MAX_SLACK,
            slack * Math.exp(-dtMs / SLACK_DECAY_TAU_MS) + speed * SLACK_VELOCITY_GAIN_K,
          )
        }
      }
      lastClampedTarget = clamped

      // Walking bob — speed-driven y oscillation on bobRef while FOLLOWING.
      // Skipped during SNIFFING (sniff timeline owns bob.y), BARKING (dog is
      // frozen mid-stride), and turn-arounds (don't fight the squash/stretch).
      // Amplitude lerps toward target each frame to avoid pop-in when speed
      // crosses the threshold. Releases bob.y back to 0 the frame after we
      // last drove it, so handoff to sniff/baseline-reset is clean.
      if (bobRef.current && currentState === 'FOLLOWING' && !turning) {
        const speedNorm = Math.min(
          1,
          Math.max(0, (speed - WALK_BOB_SPEED_THRESHOLD) / (WALK_BOB_SPEED_CAP - WALK_BOB_SPEED_THRESHOLD)),
        )
        const targetAmp = speedNorm * WALK_BOB_MAX_AMPLITUDE
        // ~10Hz lerp toward target — fast enough to feel reactive, slow enough
        // not to pop. Frame-rate independent via dtMs.
        const lerpK = 1 - Math.exp(-dtMs / 100)
        bobAmplitude += (targetAmp - bobAmplitude) * lerpK
        const phase = (now / 1000) * WALK_BOB_FREQUENCY_HZ * Math.PI * 2
        gsap.set(bobRef.current, { y: Math.sin(phase) * bobAmplitude })
        walkBobOwned = true
      } else if (walkBobOwned && (currentState === 'MORPHED' || currentState === 'PARKED')) {
        // Hard release without writing bobRef: MORPHED and PARKED already reset
        // the baseline (setBaselineInstant) and own the SVG (hidden / frozen), so
        // the damped bob writes below must NOT run — they'd fight the reset and
        // animate a hidden node, and the local amplitude would otherwise keep
        // decaying behind the morph (Codex Round-2 SPECULATIVE #1). Drop the
        // local state immediately so a fast hover-out resumes from a clean zero.
        bobAmplitude = 0
        walkBobOwned = false
      } else if (walkBobOwned) {
        // Released — let other systems own bob.y. Damp toward 0 so the last
        // frame we drove isn't a frozen offset, then hand off.
        bobAmplitude *= Math.exp(-dtMs / 80)
        if (bobAmplitude < 0.05) {
          bobAmplitude = 0
          if (bobRef.current && currentState !== 'SNIFFING') {
            // SNIFFING has its own y-timeline; don't fight it. For any other
            // state, zero out so we don't leave a stale offset behind.
            gsap.set(bobRef.current, { y: 0 })
          }
          walkBobOwned = false
        } else if (bobRef.current && currentState !== 'SNIFFING') {
          const phase = (now / 1000) * WALK_BOB_FREQUENCY_HZ * Math.PI * 2
          gsap.set(bobRef.current, { y: Math.sin(phase) * bobAmplitude })
        }
      }

      // Don't drive the dog while PAUSED_INPUT / PARKED / MORPHED. MORPHED is
      // excluded so the hidden dog freezes in place and reappears where it
      // morphed (Codex Stage-2 #3) — quickTo was frozen at the current position
      // on morph entry above.
      if (
        quickToX &&
        quickToY &&
        currentState !== 'PAUSED_INPUT' &&
        currentState !== 'PARKED' &&
        currentState !== 'MORPHED'
      ) {
        quickToX(clamped.x)
        quickToY(clamped.y)
      }

      // The DOG + LEASH are IDLE-ONLY. DELIBERATE PRODUCT DECISION (2026-05-31,
      // user request — "Option A"): while the cursor is MOVING the user sees
      // ONLY the native cursor — the dog glyph and leash are fully hidden. The
      // dog appears only once the cursor goes still and wander engages, fading
      // in (opacity = wanderGain) to amble on its leash. This is intentional —
      // do not restore the always-visible dog/leash. BARKING keeps the dog
      // visible regardless (a bark must be seen). PARKED / PAUSED_INPUT / MORPHED
      // force both off (the dog is offscreen / typing-paused / morphed-to-emoji).
      const idleVisible =
        currentState !== 'PARKED' &&
        currentState !== 'PAUSED_INPUT' &&
        currentState !== 'MORPHED' &&
        wanderGain > 0
      // Dog glyph opacity tracks wanderGain so it fades with the leash. Barking
      // overrides to keep the dog fully visible during the bark. MUST write
      // el.style.opacity (inline style), NOT setAttribute('opacity') — GSAP's
      // entry-trot leaves an inline `style.opacity:1` on dogRef, and the inline
      // style overrides the presentation attribute, so a setAttribute would be
      // silently masked (the dog would stay visible while moving).
      const dogOpacity =
        currentState === 'BARKING' ? 1 : idleVisible ? wanderGain : 0
      safeSet(dogRef, (el) => {
        el.style.opacity = String(dogOpacity)
      })
      if (idleVisible) {
        safeSet(leashRef, (el) => {
          el.setAttribute('d', computeLeashPath(tracker.targetRef.current, dogPos, slack))
          el.style.opacity = String(wanderGain)
        })
      } else {
        safeSet(leashRef, (el) => {
          el.setAttribute('d', '')
          el.style.opacity = '0'
        })
      }

      // Emoji-morph: while MORPHED the emoji IS the cursor, so steer it 1:1 to
      // the pointer (no leash clamp, no wander). Also run the recovery guard
      // (Codex #9): if the hovered element scrolled away under ScrollSmoother,
      // unmounted, or no longer sits under the pointer, pointerout may never
      // fire — so force the exit here.
      if (currentState === 'MORPHED') {
        if (emojiQuickToX && emojiQuickToY) {
          // x follows the cursor; y is pinned above the hovered word's top so
          // the word stays readable (see morphEmojiY).
          emojiQuickToX(cursor.x)
          emojiQuickToY(morphEmojiY(activeMorphEl))
        }
        // Still on target if the element under the pointer resolves to a
        // [data-emoji] that is the active element OR is nested within / contains
        // it (Codex Stage-2 #5: a nested emoji child shouldn't read as "left").
        const hitEmoji = document
          .elementFromPoint(cursor.x, cursor.y)
          ?.closest<HTMLElement>('[data-emoji]')
        const stillOnTarget =
          activeMorphEl != null &&
          activeMorphEl.isConnected &&
          hitEmoji != null &&
          (hitEmoji === activeMorphEl ||
            activeMorphEl.contains(hitEmoji) ||
            hitEmoji.contains(activeMorphEl))
        if (!stillOnTarget) {
          setActiveMorphEl(null)
          sm.transition('FOLLOWING')
        }
      } else if (activeMorphEl != null) {
        // Safety: the morph was exited by an interrupt that bypasses the
        // pointer/guard clear paths (PARKED via html-leave/visibility, or
        // PAUSED_INPUT via focus) — those go through the state machine's
        // exitMorph but never touch activeMorphEl. Clear the word treatment here
        // so the [data-emoji] span doesn't stay styled after the dog returns.
        setActiveMorphEl(null)
      }
    }

    function syncSvgViewBox() {
      safeSet(svgRef, (el) => {
        el.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
      })
    }

    // First-appearance setup. The old dramatic "trot in from the screen edge"
    // entrance is gone (2026-05-31): in the new model the dog is hidden while
    // the cursor moves and only fades in (in place, at the cursor) after a long
    // idle. So we just seed the dog at the current cursor position with
    // opacity 0 and mark entry complete — the tick's opacity gate owns all
    // visibility from here. No edge-trot, no opacity tween that would flash the
    // dog on first move.
    function entryTrot() {
      if (hasEnteredRef.current || isEnteringRef.current) return
      const dogEl = dogRef.current
      if (dogEl == null) return
      const { x, y } = tracker.targetRef.current
      gsap.set(dogEl, { x, y, opacity: 0 })
      hasEnteredRef.current = true
    }

    const ctx = gsap.context(() => {
      // Construct quickTo INSIDE the context so the tweens are reverted on cleanup.
      // Tuning lives in constants — power2.out / 0.55s instead of power3 / 0.4s
      // so the dog glides to a stop instead of snapping (cursor-stop felt sharp).
      safeSet(dogRef, (el) => {
        quickToX = gsap.quickTo(el, 'x', { duration: QUICKTO_DURATION, ease: QUICKTO_EASE })
        quickToY = gsap.quickTo(el, 'y', { duration: QUICKTO_DURATION, ease: QUICKTO_EASE })
      })
      // Emoji quickTo — snappier than the dog (the emoji IS the cursor). Built
      // in ctx so ctx.revert() tears it down on cleanup.
      safeSet(emojiRef, (el) => {
        emojiQuickToX = gsap.quickTo(el, 'x', { duration: 0.12, ease: 'power3.out' })
        emojiQuickToY = gsap.quickTo(el, 'y', { duration: 0.12, ease: 'power3.out' })
      })
      // Reset the bob group's flip + bob offsets at mount. Important because
      // the flip tween (gsap.to scaleX from the tick) is NOT captured by ctx
      // (created from listener-callback / tick scope), so scaleX from a prior
      // mount can persist across StrictMode double-mount or mode flips.
      safeSet(bobRef, (el) => {
        gsap.set(el, { scaleX: 1, x: 0, y: 0 })
      })

      // Mobile branch — no tracker, no leash, no tick
      if (mode === 'mobile') {
        hasEnteredRef.current = true
        sm.setup()
        sm.transition('IDLE')
        return
      }

      // Desktop branch
      syncSvgViewBox()
      tracker.attachResize(signal, syncSvgViewBox)
      tracker.attachPointer(signal, () => {
        if (!hasEnteredRef.current) {
          ctx.add(() => entryTrot())
        }
        // Don't unmorph on pointermove (Codex #3): moving the cursor WITHIN the
        // hovered [data-emoji] element still fires pointermove, and
        // MORPHED→FOLLOWING is a valid edge — so an unguarded transition here
        // would drop the emoji the instant the user nudged the cursor inside the
        // word. The morph is exited only by pointerout or the in-tick
        // isConnected/closest guard.
        if (sm.stateRef.current !== 'MORPHED') sm.transition('FOLLOWING')
      })
      tracker.attachHtmlEdge(
        signal,
        () => sm.transition('PARKED'),
        () => sm.transition('IDLE'),
      )
      // Click anywhere → bark. Suppressed when the user is typing in a form
      // (PAUSED_INPUT) and while MORPHED (Codex #11) — clicking a hovered
      // [data-emoji] element must not fire a bark on the hidden dog. triggerBark
      // clears the scheduled timer first so we don't get a delayed double-bark.
      window.addEventListener(
        'click',
        () => {
          const s = sm.stateRef.current
          if (s !== 'PAUSED_INPUT' && s !== 'MORPHED') sm.triggerBark()
        },
        { signal },
      )
      // Hover delegation for the emoji-morph. ONE pointerover/pointerout pair on
      // the document (not per-element) so it's robust to nested elements and to
      // [data-emoji] nodes added/removed dynamically. closest() walks up from the
      // event target to the nearest [data-emoji] ancestor.
      document.addEventListener(
        'pointerover',
        (e) => {
          const el = (e.target instanceof Element ? e.target : null)?.closest<HTMLElement>('[data-emoji]')
          if (el == null) return
          const emoji = el.dataset.emoji
          if (!emoji) return
          // No morph while typing or parked/disabled — the state machine rejects
          // those edges anyway, but bail early so we don't set activeMorphEl.
          const s = sm.stateRef.current
          if (s === 'PAUSED_INPUT' || s === 'PARKED' || s === 'DISABLED') return
          setActiveMorphEl(el)
          safeSet(emojiRef, (node) => { node.textContent = emoji })
          // Seed the emoji at its resting spot (cursor x, pinned above the
          // word's top) so it pops in where the first tick will hold it rather
          // than from a stale position or from on top of the word.
          if (emojiQuickToX && emojiQuickToY) {
            gsap.set(emojiRef.current, { x: tracker.targetRef.current.x, y: morphEmojiY(el) })
          }
          sm.transition('MORPHED')
        },
        { signal },
      )
      document.addEventListener(
        'pointerout',
        (e) => {
          if (activeMorphEl == null) return
          // Only exit when the pointer actually left the active element (not when
          // moving between its children). relatedTarget is where the pointer went.
          const to = e.relatedTarget instanceof Node ? e.relatedTarget : null
          if (to != null && activeMorphEl.contains(to)) return
          setActiveMorphEl(null)
          if (sm.stateRef.current === 'MORPHED') sm.transition('FOLLOWING')
        },
        { signal },
      )
      tracker.attachFocus(
        signal,
        () => sm.transition('PAUSED_INPUT'),
        () => {
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
      // Kill state-machine timelines explicitly: they were created from listener
      // callbacks (sm.transition → fireBark/startSniffLoop), which run AFTER the
      // gsap.context() callback returned, so they are NOT captured by ctx. Without
      // this explicit kill, ctx.revert() leaves the sniff timeline (repeat: -1)
      // running on detached SVG nodes — a real memory leak Codex caught in final review.
      sm.timelineRefs.barkTimelineRef.current?.kill()
      sm.timelineRefs.barkTimelineRef.current = null
      sm.timelineRefs.sniffTimelineRef.current?.kill()
      sm.timelineRefs.sniffTimelineRef.current = null
      // trotOffscreen creates a tween outside ctx (same callback-scope
      // reason as the timelines above). Explicit kill prevents it from
      // continuing to translate a detached <g> after unmount.
      sm.killTrotTween()
      // Morph fade tweens are also callback-scoped. killMorphTween kills any
      // in-flight fade AND force-restores the native cursor, so a teardown
      // mid-morph never leaves the page stuck with cursor:none.
      sm.killMorphTween()
      // Drop the word-treatment class if we tore down mid-hover, so the
      // [data-emoji] span isn't left styled after the dog is gone.
      setActiveMorphEl(null)
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
      emojiRef={emojiRef}
      rootRef={rootRef}
      svgRef={svgRef}
      svgLayerRef={svgLayerRef}
    />
  )
}
