// components/landing/CursorDog/constants.ts
export const MAX_STRETCH = 240             // px — max leash length (clamp)
export const SNIFF_AFTER_MS = 3000         // ms cursor stationary before sniff
export const BARK_MIN_MS = 8000            // ms — random schedule lower bound
export const BARK_MAX_MS = 20000           // ms — random schedule upper bound
export const BARK_TILT_DEG = 12            // bark head rotation
export const BARK_SHOUT_PEAK_SCALE = 1.8   // shoutRef target scale at bark peak (0.5 → this). Bigger = louder-feeling lines.
export const SNIFF_TILT_DEG = -6           // sniff head dip
export const SLACK_DECAY_TAU_MS = 500      // exponential time constant for slack
export const SLACK_VELOCITY_GAIN_K = 0.00005 // velocity-to-slack gain (per-frame add). EMA with tau=500ms converges to ~v*K*tau/dt; with v=500px/s, dt=16ms this lands at ~0.78 (≈23px droop). The plan's draft value 0.01 was ~200x too high and caused off-screen leash control points on cursor teleport (e.g. automation tools). Spec marked this as in-impl tuning.
export const MAX_SLACK = 1.5               // hard clamp — defensive against cursor teleport (display sleep, automation, dock unhide). 1.5 → max ~45px leash droop.
// Lively idle wander (wanderPhases.ts). The dog trots to a random point within
// WANDER_TROT_RADIUS of the cursor, pauses WANDER_HOLD_MIN..MAX_MS, then picks a
// new point — reads as a real dog exploring rather than the old smooth float.
// The positional target is blended toward the cursor by wanderGain, so cursor
// motion always wins (gain 0 → track cursor; gain 1 → full trot target).
export const WANDER_TROT_RADIUS = 110      // px — how far from the cursor the dog will roam
export const WANDER_ARRIVE_EPS = 6         // px — distance at which a trot target counts as reached
export const WANDER_HOLD_MIN_MS = 500      // ms — shortest pause at a target
export const WANDER_HOLD_MAX_MS = 1700     // ms — longest pause at a target
// Wander only kicks in when the cursor has been still for this long. While the
// cursor is moving (and for this whole delay after it stops) the dog + leash
// stay fully hidden — the user just sees the native cursor. After the delay,
// wanderGain ramps 0 → 1 over WANDER_RAMP_MS so the dog fades in + ambles
// smoothly. Set to 60s per user request (2026-05-31): the wandering dog is a
// deliberate "pause a full minute and it appears" easter egg, not an
// always-present companion.
export const WANDER_GATE_DELAY_MS = 3000
export const WANDER_RAMP_MS = 600
// quickTo tuning — power3 / 0.4s reads as a hard snap on stop (the curve is
// near-vertical at the end). power2.out / 0.55s is gentler and gives the dog
// a little glide so it feels like it carries weight.
export const QUICKTO_DURATION = 0.55
export const QUICKTO_EASE = 'power2.out'
// Turn-around — replace instant scaleX flip with a 2-stage squash/stretch.
// Phase 1: bob.scaleX → 0 (squashes to zero width, reading as the dog turning
// edge-on). Phase 2: scaleX → ±1 (stretches back in the new direction).
export const TURN_SQUASH_MS = 0.18
export const TURN_STRETCH_MS = 0.22
// Speed-driven walking bob. While FOLLOWING and moving faster than the
// threshold, bob.y oscillates as a sine of time. Amplitude scales linearly
// with speed up to the cap; below the threshold bob damps back to 0.
export const WALK_BOB_SPEED_THRESHOLD = 60   // px/s — below this no bob
export const WALK_BOB_SPEED_CAP = 800        // px/s — amplitude saturates here
export const WALK_BOB_MAX_AMPLITUDE = 2.5    // px — peak y offset at cap speed
export const WALK_BOB_FREQUENCY_HZ = 6       // bob cycles per second
// Emoji-morph (MORPHED state). On hovering a [data-emoji] element the SVG dog +
// leash fade out and a large emoji pops in at the cursor, with the native cursor
// hidden. Tuning: the emoji scales from MORPH_EMOJI_POP_FROM to 1 on entry.
export const MORPH_FADE_MS = 0.18          // s — SVG-layer fade out/in duration
export const MORPH_EMOJI_POP_MS = 0.28     // s — emoji scale-in duration on entry
export const MORPH_EMOJI_POP_FROM = 0.4    // emoji starts at this scale and pops to 1
export const MORPH_EMOJI_SIZE_PX = 64      // px — rendered emoji glyph size. Cursor/animation tuning, not a design token (emojis aren't in the Figma type scale).
// px — vertical gap between the emoji's bottom and the TOP of the hovered word.
// While MORPHED the emoji is pinned above the hovered element's top edge (not
// centered on the cursor) so the word stays readable no matter how tall it is
// or where in the word the pointer sits. The controller computes the emoji's
// y as `wordTop - MORPH_EMOJI_GAP_PX - MORPH_EMOJI_SIZE_PX`.
export const MORPH_EMOJI_GAP_PX = 10
export const RAF_WAKE_THRESHOLD_MS = 5000  // RAF pause > this → treat as wake
export const PARK_FADE_OPACITY = 0.4       // dog opacity when parked
export const ENTRY_TROT_MS = 600           // first-appearance trot duration
export const SHOUT_SVG_ORIGIN = '29.7 7.4' // centroid of shout-line origins; load-bearing
