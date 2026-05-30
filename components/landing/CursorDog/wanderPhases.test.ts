// NOTE: `.ts` extension on the import is required for Node's native TypeScript
// stripping (--experimental-strip-types). Bundler-style extensionless imports
// do NOT resolve under node:test on Node 25.
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  nextWanderState,
  initialWanderState,
  resetWanderState,
  type WanderConfig,
  type WanderState,
  type Vec2,
} from './wanderPhases.ts'

const CONFIG: WanderConfig = {
  trotRadius: 100,
  arriveEps: 5,
  holdMinMs: 600,
  holdMaxMs: 1800,
}

// Deterministic rng that walks a fixed sequence (looping). Lets us assert exact
// target coordinates and hold durations.
function seqRng(values: number[]): () => number {
  let i = 0
  return () => {
    const v = values[i % values.length]
    i += 1
    return v
  }
}

const CURSOR: Vec2 = { x: 500, y: 400 }

describe('nextWanderState', () => {
  it('picks a target and trots when state has no target', () => {
    const state = initialWanderState()
    assert.equal(state.target, null)
    // angle draw = 0 → cos=1, sin=0; radius draw = 1 → sqrt(1)*100 = 100
    const next = nextWanderState(state, CURSOR, CURSOR, 1000, seqRng([0, 1]), CONFIG)
    assert.equal(next.phase, 'TROTTING')
    assert.ok(next.target)
    assert.equal(Math.round(next.target!.x), 600) // 500 + cos(0)*100
    assert.equal(Math.round(next.target!.y), 400) // 400 + sin(0)*100
  })

  it('draws targets within trotRadius of the cursor', () => {
    // Sweep many rng pairs; every target must be within trotRadius.
    let state = initialWanderState()
    const rng = seqRng([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.05])
    for (let k = 0; k < 20; k++) {
      state = nextWanderState({ phase: 'TROTTING', target: null, holdUntil: 0 }, CURSOR, CURSOR, k * 100, rng, CONFIG)
      const d = Math.hypot(state.target!.x - CURSOR.x, state.target!.y - CURSOR.y)
      assert.ok(d <= CONFIG.trotRadius + 1e-9, `target ${d}px from cursor exceeds radius`)
    }
  })

  it('stays TROTTING while far from target', () => {
    const target: Vec2 = { x: 600, y: 400 }
    const state: WanderState = { phase: 'TROTTING', target, holdUntil: 0 }
    const dogPos: Vec2 = { x: 500, y: 400 } // 100px away, > arriveEps
    const next = nextWanderState(state, dogPos, CURSOR, 1000, seqRng([0.5]), CONFIG)
    assert.equal(next.phase, 'TROTTING')
    assert.deepEqual(next.target, target) // unchanged
  })

  it('switches to PAUSED on arrival and sets a randomized holdUntil', () => {
    const target: Vec2 = { x: 600, y: 400 }
    const state: WanderState = { phase: 'TROTTING', target, holdUntil: 0 }
    const dogPos: Vec2 = { x: 598, y: 401 } // within arriveEps (5)
    // rng = 0.5 → hold = 600 + 0.5*(1800-600) = 1200
    const next = nextWanderState(state, dogPos, CURSOR, 1000, seqRng([0.5]), CONFIG)
    assert.equal(next.phase, 'PAUSED')
    assert.equal(next.holdUntil, 1000 + 1200)
    assert.deepEqual(next.target, target) // holds at the same spot
  })

  it('holds while PAUSED and now < holdUntil', () => {
    const target: Vec2 = { x: 600, y: 400 }
    const state: WanderState = { phase: 'PAUSED', target, holdUntil: 5000 }
    const next = nextWanderState(state, target, CURSOR, 4000, seqRng([0.5]), CONFIG)
    assert.equal(next.phase, 'PAUSED')
    assert.equal(next.holdUntil, 5000) // unchanged
    assert.deepEqual(next.target, target)
  })

  it('picks a fresh target near cursor and trots when PAUSED hold expires', () => {
    const oldTarget: Vec2 = { x: 600, y: 400 }
    const state: WanderState = { phase: 'PAUSED', target: oldTarget, holdUntil: 5000 }
    // now >= holdUntil → new target. angle=0, radius=1 → (600, 400) relative to cursor
    const next = nextWanderState(state, oldTarget, CURSOR, 5000, seqRng([0, 1]), CONFIG)
    assert.equal(next.phase, 'TROTTING')
    assert.equal(Math.round(next.target!.x), 600)
    assert.equal(Math.round(next.target!.y), 400)
  })

  it('resetWanderState clears the target so the next tick re-picks near the new cursor', () => {
    const reset = resetWanderState()
    assert.equal(reset.target, null)
    assert.equal(reset.phase, 'TROTTING')
    // New cursor far away → next target is drawn around the NEW cursor, not the old one.
    const newCursor: Vec2 = { x: 50, y: 50 }
    const next = nextWanderState(reset, newCursor, newCursor, 9000, seqRng([0, 1]), CONFIG)
    const d = Math.hypot(next.target!.x - newCursor.x, next.target!.y - newCursor.y)
    assert.ok(d <= CONFIG.trotRadius + 1e-9)
  })

  it('full cycle: trot → arrive → pause → expire → new trot', () => {
    const rng = seqRng([0, 1, 0.5, 0, 1]) // target1, hold, target2
    let state = initialWanderState()
    // 1. no target → pick target1 = (600,400)
    state = nextWanderState(state, CURSOR, CURSOR, 0, rng, CONFIG)
    assert.equal(state.phase, 'TROTTING')
    // 2. arrive at target1
    state = nextWanderState(state, { x: 600, y: 400 }, CURSOR, 100, rng, CONFIG)
    assert.equal(state.phase, 'PAUSED')
    const holdEnd = state.holdUntil
    assert.ok(holdEnd > 100)
    // 3. still holding
    state = nextWanderState(state, { x: 600, y: 400 }, CURSOR, holdEnd - 1, rng, CONFIG)
    assert.equal(state.phase, 'PAUSED')
    // 4. hold expires → new target, trotting
    state = nextWanderState(state, { x: 600, y: 400 }, CURSOR, holdEnd, rng, CONFIG)
    assert.equal(state.phase, 'TROTTING')
  })
})
