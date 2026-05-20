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
      break
  }

  return true
}
