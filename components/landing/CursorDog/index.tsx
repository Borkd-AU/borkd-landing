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

      if (
        quickToX &&
        quickToY &&
        currentState !== 'PAUSED_INPUT' &&
        currentState !== 'PARKED'
      ) {
        quickToX(clamped.x)
        quickToY(clamped.y)
      }

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
      if (hasEnteredRef.current || isEnteringRef.current) return
      const dogEl = dogRef.current
      if (dogEl == null) return
      isEnteringRef.current = true
      const startX = window.innerWidth + 32
      const startY = window.innerHeight * 0.6
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
      safeSet(dogRef, (el) => {
        quickToX = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' })
        quickToY = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' })
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
          entryTrot()
        }
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
