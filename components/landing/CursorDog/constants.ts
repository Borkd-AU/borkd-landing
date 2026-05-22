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
export const WANDER_RADIUS = 80            // px — amplitude of the dog's ambient wander around the cursor. Composed of two incommensurate sinusoids per axis so the orbit is smooth and non-repeating. Set to 0 to make the dog overlap the cursor (the pre-wander behavior).
// Wander only kicks in when the cursor has been still for this long. While the
// cursor is moving, wander is gated to 0 so the dog tracks cleanly. After this
// delay, wanderGain ramps 0 → 1 over WANDER_RAMP_MS so the amble starts smooth
// rather than snapping on.
export const WANDER_GATE_DELAY_MS = 250
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
export const RAF_WAKE_THRESHOLD_MS = 5000  // RAF pause > this → treat as wake
export const PARK_FADE_OPACITY = 0.4       // dog opacity when parked
export const ENTRY_TROT_MS = 600           // first-appearance trot duration
export const SHOUT_SVG_ORIGIN = '29.7 7.4' // centroid of shout-line origins; load-bearing
