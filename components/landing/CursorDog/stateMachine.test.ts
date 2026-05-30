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
    enterMorph: () => calls.push('enterMorph'),
    exitMorph: () => calls.push('exitMorph'),
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
      ['PAUSED_INPUT', 'PARKED'],
      // Emoji-morph edges
      ['IDLE', 'MORPHED'],
      ['FOLLOWING', 'MORPHED'],
      ['SNIFFING', 'MORPHED'],
      ['BARKING', 'MORPHED'],
      ['MORPHED', 'FOLLOWING'],
      ['MORPHED', 'IDLE'],
      ['MORPHED', 'PARKED'],
      ['MORPHED', 'PAUSED_INPUT'],
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
      ['IDLE', 'SNIFFING'],
      ['DISABLED', 'PARKED'],
      // No morph from DISABLED or while paused on a text input (no morph while typing)
      ['DISABLED', 'MORPHED'],
      ['PAUSED_INPUT', 'MORPHED'],
      ['PARKED', 'MORPHED'],
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
    const { ctx, sideEffects, calls } = makeContext('PARKED')
    applyTransition(ctx, 'IDLE', sideEffects)
    applyTransition(ctx, 'PARKED', sideEffects)
    applyTransition(ctx, 'IDLE', sideEffects)
    const scheduleCount = calls.filter((c) => c === 'scheduleBark').length
    const clearCount = calls.filter((c) => c === 'clearBark').length
    assert.equal(scheduleCount, 2, 'each PARKED → IDLE schedules exactly one bark')
    assert.equal(clearCount, 1, 'each IDLE → PARKED clears exactly one bark')
  })

  it('entering MORPHED kills sniff/bark, resets baseline, and calls enterMorph, but never moves the dog (no trotOffscreen)', () => {
    // Enter from SNIFFING — the case where a stale mid-animation baseline would
    // otherwise survive (Codex Stage-3 NEW issue).
    const { ctx, sideEffects, calls } = makeContext('SNIFFING')
    applyTransition(ctx, 'MORPHED', sideEffects)
    assert.equal(ctx.state, 'MORPHED')
    assert.ok(calls.includes('enterMorph'), 'enterMorph fires on entry')
    assert.ok(calls.includes('killSniffTimeline'), 'sniff timeline killed')
    assert.ok(calls.includes('killBarkTimeline'), 'bark timeline killed')
    assert.ok(calls.includes('clearBark'), 'pending bark cleared')
    assert.ok(calls.includes('setBaselineInstant'), 'visual baseline reset so dog reappears clean')
    assert.ok(!calls.includes('trotOffscreen'), 'morph must NOT move the dog offscreen')
    assert.ok(!calls.includes('exitMorph'), 'no exit on entry')
    // setBaselineInstant must run BEFORE enterMorph (reset, then fade out).
    assert.ok(
      calls.indexOf('setBaselineInstant') < calls.indexOf('enterMorph'),
      'baseline reset precedes the morph fade',
    )
  })

  it('every MORPHED exit path calls exitMorph exactly once', () => {
    for (const to of ['FOLLOWING', 'IDLE', 'PARKED', 'PAUSED_INPUT'] as const) {
      const { ctx, sideEffects, calls } = makeContext('MORPHED')
      const accepted = applyTransition(ctx, to, sideEffects)
      assert.equal(accepted, true, `MORPHED → ${to} should be accepted`)
      const exitCount = calls.filter((c) => c === 'exitMorph').length
      assert.equal(exitCount, 1, `MORPHED → ${to} must call exitMorph exactly once`)
    }
  })

  it('non-MORPHED exits never call exitMorph (no spurious restore)', () => {
    const { ctx, sideEffects, calls } = makeContext('FOLLOWING')
    applyTransition(ctx, 'SNIFFING', sideEffects)
    applyTransition(ctx, 'FOLLOWING', sideEffects)
    assert.ok(!calls.includes('exitMorph'), 'exitMorph only fires when leaving MORPHED')
  })
})
