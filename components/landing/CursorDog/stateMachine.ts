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
  | 'MORPHED'

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
  /** Enter the emoji-morph: fade the SVG dog+leash out, show the emoji, hide native cursor. */
  enterMorph: () => void
  /** Leave the emoji-morph: restore the SVG dog, hide the emoji, restore the native cursor. */
  exitMorph: () => void
}

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
  'PAUSED_INPUT→PARKED',
  // Emoji-morph (hover a [data-emoji] element). Enter from any "live" cursor
  // state; never from DISABLED or while paused on a text input (no morph while
  // typing). Exit back to FOLLOWING (hover ended, cursor still active) or be
  // interrupted to PARKED (pointer left the document / tab hidden) or
  // PAUSED_INPUT (focus moved into a text field while morphed).
  'IDLE→MORPHED',
  'FOLLOWING→MORPHED',
  'SNIFFING→MORPHED',
  'BARKING→MORPHED',
  'MORPHED→FOLLOWING',
  'MORPHED→IDLE',
  'MORPHED→PARKED',
  'MORPHED→PAUSED_INPUT',
])

export function applyTransition(
  ctx: TransitionContext,
  next: DogState,
  sideEffects: SideEffects,
): boolean {
  const current = ctx.state

  if (current === next) return false
  if (!VALID_EDGES.has(`${current}→${next}`)) return false

  ctx.state = next

  switch (next) {
    case 'IDLE':
      // Switch is on the NEXT state, so leaving MORPHED must be cleaned up
      // explicitly here (Codex #5) — otherwise cursor:none / hidden SVG / stale
      // emoji survive a MORPHED→IDLE exit.
      if (current === 'MORPHED') sideEffects.exitMorph()
      if (current === 'PARKED' || current === 'BARKING') {
        if (current === 'PARKED') sideEffects.resetLastMoveAt()
        sideEffects.scheduleBark()
      } else if (current === 'DISABLED') {
        sideEffects.scheduleBark()
      }
      break

    case 'FOLLOWING':
      if (current === 'MORPHED') sideEffects.exitMorph()
      if (current === 'SNIFFING') {
        sideEffects.killSniffTimeline()
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
      if (current === 'MORPHED') sideEffects.exitMorph()
      sideEffects.killBarkTimeline()
      sideEffects.killSniffTimeline()
      sideEffects.clearBark()
      sideEffects.setBaselineInstant()
      sideEffects.trotOffscreen()
      break

    case 'PAUSED_INPUT':
      if (current === 'MORPHED') sideEffects.exitMorph()
      sideEffects.killBarkTimeline()
      sideEffects.killSniffTimeline()
      sideEffects.clearBark()
      sideEffects.setBaselineInstant()
      break

    case 'MORPHED':
      // Entering the emoji-morph. Kill the sniff/bark timelines, clear the
      // pending bark, AND reset the visual baseline like the other interrupt
      // states (Codex #6 + Stage-3 NEW): if hover starts mid-SNIFFING or
      // mid-BARKING, killing the timeline alone would leave bobRef/headRef/
      // shoutRef frozen mid-animation, so the dog reappears with a stale
      // head-tilt or visible shout lines on morph exit. setBaselineInstant()
      // zeroes those (it never touches dogRef, so the frozen follow position is
      // preserved). Do NOT call trotOffscreen / move dogRef — the morph happens
      // in place and the dog must reappear exactly where it was.
      sideEffects.killBarkTimeline()
      sideEffects.killSniffTimeline()
      sideEffects.clearBark()
      sideEffects.setBaselineInstant()
      sideEffects.enterMorph()
      break

    case 'DISABLED':
      break
  }

  return true
}
