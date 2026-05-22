// components/landing/CursorDog/useDogStateMachine.ts
import { gsap } from '@/lib/gsap'
import {
  BARK_MIN_MS,
  BARK_MAX_MS,
  BARK_TILT_DEG,
  BARK_SHOUT_PEAK_SCALE,
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
  /** Fire a bark immediately, cancelling the scheduled timer-bark first so we don't double-fire. */
  triggerBark: () => void
  /** Pending-timer set — caller's cleanup MUST iterate + clearTimeout + clear() */
  pendingTimers: Set<number>
  /** Timeline refs — caller's cleanup is ctx.revert(), but these are used by transitions */
  timelineRefs: TimelineRefs
  /** Kill any in-flight trot tween. Caller's cleanup MUST call this on unmount. */
  killTrotTween: () => void
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
  // trotOffscreen() creates a tween outside the controller's gsap.context,
  // so ctx.revert() in the cleanup path can't reach it. Track it here so
  // the cleanup can explicitly kill it on unmount / route change.
  let trotTween: gsap.core.Tween | null = null

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
    if (refs.bobRef.current) gsap.set(refs.bobRef.current, { x: 0, y: 0 })
    if (refs.headRef.current) gsap.set(refs.headRef.current, { rotation: 0 })
    if (refs.shoutRef.current) gsap.set(refs.shoutRef.current, { opacity: 0, scale: 1 })
  }

  function startSniffLoop(): void {
    // Sniff bob AND x-drift both live on bobRef so they don't fight quickTo
    // for dogRef ownership. bobRef.x is reset to 0 in setBaselineInstant.
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
        { opacity: 1, scale: BARK_SHOUT_PEAK_SCALE, duration: 0.08, svgOrigin: SHOUT_SVG_ORIGIN },
      )
      .to({}, { duration: 0.20 }) // hold
      .to(refs.shoutRef.current, { opacity: 0, duration: 0.15, svgOrigin: SHOUT_SVG_ORIGIN })
      .to(refs.headRef.current, { rotation: 0, duration: 0.20, ease: 'power2.in' })
    tl.eventCallback('onComplete', () => {
      barkTimelineRef.current = null
      if (stateRef.current === 'BARKING') transition('IDLE')
    })
    barkTimelineRef.current = tl
  }

  function trotOffscreen(): void {
    if (refs.dogRef.current == null) return
    // No opacity fade — the dog is offscreen during PARKED anyway, and a fade
    // here only manifests on return as "the dog came back lighter". Keep the
    // trot itself but leave opacity at 1.0 throughout.
    // Kill any in-flight previous trot first so we don't leak a tween if
    // the dog is re-parked while still trotting out.
    trotTween?.kill()
    trotTween = gsap.to(refs.dogRef.current, {
      x: window.innerWidth + 32,
      duration: 0.6,
      ease: 'power2.in',
      onComplete: () => { trotTween = null },
    })
  }

  function killTrotTween(): void {
    trotTween?.kill()
    trotTween = null
  }

  function resetLastMoveAt(): void {
    // No-op stub — wired by the controller via injection if needed.
    // The controller's own state-change handler resets lastMoveAt on PARKED → IDLE.
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
    return applyTransition(
      {
        get state() { return stateRef.current },
        set state(v) { stateRef.current = v },
      } as TransitionContext,
      next,
      sideEffects,
    )
  }

  /** Clear the scheduled-bark timer (if any) then transition to BARKING.
   *  Used by the dev hook AND by the click-to-bark handler — both want the
   *  next bark to be NOW, without the pending timer also firing later. */
  function triggerBark(): void {
    clearBark()
    transition('BARKING')
  }

  function setup(): void {
    if (process.env.NODE_ENV === 'development') {
      ;(window as unknown as { __borkdDog?: unknown }).__borkdDog = {
        state: () => stateRef.current,
        triggerBark,
        peekBarkTimer: () => barkTimerHandle,
      }
      console.log('%c🐕 borkd', 'color:#3A39FF;font-weight:bold', '— try window.__borkdDog.triggerBark()')
    }
  }

  return {
    stateRef,
    transition,
    triggerBark,
    pendingTimers,
    timelineRefs: { barkTimelineRef, sniffTimelineRef },
    killTrotTween,
    setup,
  }
}
