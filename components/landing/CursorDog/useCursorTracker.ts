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
