/**
 * Showdown easing → Motion cubic-bezier curves.
 *
 * Showdown uses jQuery-style easing names. These are the closest
 * cubic-bezier equivalents for CSS/Motion transitions.
 */

/** Parabolic arc — good for projectiles that go up then down */
export const BALLISTIC = [0.5, -0.3, 0.7, 1.3] as const;

/** Accelerate from rest */
export const ACCEL = [0.4, 0, 1, 1] as const;

/** Decelerate to rest */
export const DECEL = [0, 0, 0.2, 1] as const;

/** jQuery-style swing (similar to ease-in-out) */
export const SWING = [0.36, 0.07, 0.19, 0.97] as const;

/** Linear — constant speed */
export const LINEAR = [0, 0, 1, 1] as const;

/** Snappy — quick start, smooth landing (good for impacts) */
export const SNAPPY = [0.2, 0, 0, 1] as const;

/** Elastic — overshoots then settles (good for bounces) */
export const ELASTIC = [0.68, -0.55, 0.27, 1.55] as const;

// ── Duration constants ──────────────────────────────────────────────────

/** Standard durations for animation events (ms) */
export const DURATION = {
  MOVE: 600,
  DAMAGE: 400,
  FAINT: 600,
  SWITCH_OUT: 300,
  SWITCH_IN: 500,
  BOOST: 300,
  STATUS: 300,
  SUPER_EFFECTIVE: 200,
  CRIT: 200,
  WEATHER: 700,
  SCREEN_SHAKE: 300,
  FLASH: 200,
  POPUP: 800,
} as const;
