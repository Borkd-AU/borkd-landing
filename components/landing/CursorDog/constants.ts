// components/landing/CursorDog/constants.ts
export const MAX_STRETCH = 240             // px — max leash length (clamp)
export const SNIFF_AFTER_MS = 3000         // ms cursor stationary before sniff
export const BARK_MIN_MS = 20000           // ms — random schedule lower bound
export const BARK_MAX_MS = 40000           // ms — random schedule upper bound
export const BARK_TILT_DEG = 12            // bark head rotation
export const SNIFF_TILT_DEG = -6           // sniff head dip
export const SLACK_DECAY_TAU_MS = 500      // exponential time constant for slack
export const SLACK_VELOCITY_GAIN_K = 0.01  // velocity-to-slack gain; tune visually
export const RAF_WAKE_THRESHOLD_MS = 5000  // RAF pause > this → treat as wake
export const PARK_FADE_OPACITY = 0.4       // dog opacity when parked
export const ENTRY_TROT_MS = 600           // first-appearance trot duration
export const SHOUT_SVG_ORIGIN = '29.7 7.4' // centroid of shout-line origins; load-bearing
