// components/landing/CursorDog/wanderPhases.ts
// Pure logic. No project imports. Loadable by node --test --experimental-strip-types.
//
// The "lively idle wander" mini-FSM. While the cursor is idle the dog should
// read as a real dog exploring: trot to a spot near the cursor, pause there a
// beat, then pick a new spot — rather than the old always-on dual-sinusoid
// float (which drifted ~70px in a smooth arc and felt lifeless).
//
// This module is PURELY POSITIONAL. It decides *where* the dog wants to be; it
// never touches the DogState state machine. The existing FOLLOWING→SNIFFING
// auto-gate (index.tsx) still owns the head-dip sniff animation, so the two
// compose instead of fighting (Codex round-1 advisory #12/#13): the dog trots
// and pauses via this FSM, and independently dips to sniff when the cursor has
// been still past SNIFF_AFTER_MS.
//
// Determinism: `now` and `rng` are injected so the FSM is fully testable. `rng`
// is a () => number in [0, 1) (Math.random in production).

export type WanderPhase = 'TROTTING' | 'PAUSED'

export interface Vec2 {
  x: number
  y: number
}

export interface WanderState {
  phase: WanderPhase
  /** Absolute target the dog is trotting toward (null until first target picked). */
  target: Vec2 | null
  /** Timestamp (ms) at which the current PAUSED hold ends and a new target is picked. */
  holdUntil: number
}

export interface WanderConfig {
  /** Radius (px) around the cursor within which trot targets are drawn. */
  trotRadius: number
  /** A target is "reached" once the dog is within this many px of it. */
  arriveEps: number
  /** Random pause-at-target duration bounds (ms). */
  holdMinMs: number
  holdMaxMs: number
}

export function initialWanderState(): WanderState {
  return { phase: 'TROTTING', target: null, holdUntil: 0 }
}

// Draw a uniform-ish point inside the trot radius around `center`. Uses two rng
// draws: one for angle, one for radius (sqrt for area-uniformity so targets
// aren't bunched at the center).
function pickTarget(center: Vec2, radius: number, rng: () => number): Vec2 {
  const angle = rng() * Math.PI * 2
  const r = Math.sqrt(rng()) * radius
  return { x: center.x + Math.cos(angle) * r, y: center.y + Math.sin(angle) * r }
}

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/**
 * Advance the wander FSM one tick.
 *
 * @param state    current FSM state
 * @param dogPos   the dog's current rendered position
 * @param cursor   the cursor position (wander targets are drawn around this)
 * @param now      current time (ms, monotonic)
 * @param rng      () => number in [0, 1)
 * @param config   tuning
 * @returns        next FSM state. `state.target` is the absolute point the
 *                 controller should steer the dog toward this frame.
 *
 * Phases:
 *  - TROTTING: steer toward `target`. On arrival (dist < arriveEps) switch to
 *    PAUSED and set a randomized holdUntil.
 *  - PAUSED:   hold at the current target. When now >= holdUntil, pick a fresh
 *    target near the cursor and switch back to TROTTING.
 *
 * If `target` is null (first call, or just reset on cursor motion), a target is
 * picked immediately and the phase is TROTTING.
 */
export function nextWanderState(
  state: WanderState,
  dogPos: Vec2,
  cursor: Vec2,
  now: number,
  rng: () => number,
  config: WanderConfig,
): WanderState {
  // No target yet → pick one and trot.
  if (state.target == null) {
    return { phase: 'TROTTING', target: pickTarget(cursor, config.trotRadius, rng), holdUntil: 0 }
  }

  if (state.phase === 'TROTTING') {
    if (dist(dogPos, state.target) < config.arriveEps) {
      const hold = config.holdMinMs + rng() * (config.holdMaxMs - config.holdMinMs)
      return { phase: 'PAUSED', target: state.target, holdUntil: now + hold }
    }
    return state
  }

  // PAUSED
  if (now >= state.holdUntil) {
    return { phase: 'TROTTING', target: pickTarget(cursor, config.trotRadius, rng), holdUntil: 0 }
  }
  return state
}

/**
 * Reset the wander FSM. Called by the controller the moment cursor motion
 * resumes (wanderGain → 0), so a stale target near the OLD cursor position
 * can't keep pulling the dog after the user starts moving again (Codex round-1
 * advisory #13). Next time wander re-engages, a fresh target is drawn around
 * the new cursor position.
 */
export function resetWanderState(): WanderState {
  return initialWanderState()
}
