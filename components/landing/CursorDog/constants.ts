// components/landing/CursorDog/constants.ts
export const MAX_STRETCH = 240             // px — max leash length (clamp)
export const SNIFF_AFTER_MS = 3000         // ms cursor stationary before sniff
export const BARK_MIN_MS = 20000           // ms — random schedule lower bound
export const BARK_MAX_MS = 40000           // ms — random schedule upper bound
export const BARK_TILT_DEG = 12            // bark head rotation
export const SNIFF_TILT_DEG = -6           // sniff head dip
export const SLACK_DECAY_TAU_MS = 500      // exponential time constant for slack
export const SLACK_VELOCITY_GAIN_K = 0.00005 // velocity-to-slack gain (per-frame add). EMA with tau=500ms converges to ~v*K*tau/dt; with v=500px/s, dt=16ms this lands at ~0.78 (≈23px droop). The plan's draft value 0.01 was ~200x too high and caused off-screen leash control points on cursor teleport (e.g. automation tools). Spec marked this as in-impl tuning.
export const MAX_SLACK = 1.5               // hard clamp — defensive against cursor teleport (display sleep, automation, dock unhide). 1.5 → max ~45px leash droop.
export const WANDER_RADIUS = 80            // px — amplitude of the dog's ambient wander around the cursor. Composed of two incommensurate sinusoids per axis so the orbit is smooth and non-repeating. Set to 0 to make the dog overlap the cursor (the pre-wander behavior).
export const RAF_WAKE_THRESHOLD_MS = 5000  // RAF pause > this → treat as wake
export const PARK_FADE_OPACITY = 0.4       // dog opacity when parked
export const ENTRY_TROT_MS = 600           // first-appearance trot duration
export const SHOUT_SVG_ORIGIN = '29.7 7.4' // centroid of shout-line origins; load-bearing
