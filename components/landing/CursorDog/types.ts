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
  | 'MORPHED'

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

/**
 * The emoji-morph layer. A plain DOM `<div>` (NOT inside the SVG) so the emoji
 * glyph renders with the system emoji font. Lives as a sibling of the SVG in the
 * same fixed root; its `x`/`y` are written by a dedicated quickTo while MORPHED,
 * and its `textContent` is set to the hovered element's `data-emoji`. Kept
 * separate from DogRefs because the SVG layer fades while this stays visible
 * (Codex #8).
 */
export interface EmojiRefs {
  emojiRef: RefObject<HTMLDivElement | null>
}

export interface TimelineRefs {
  barkTimelineRef: { current: gsap.core.Timeline | null }
  sniffTimelineRef: { current: gsap.core.Timeline | null }
}
