/**
 * Shared types for move animation template configs.
 *
 * These config interfaces are used by both:
 *   - Server: to build per-battle animation configs sent via BATTLE_START
 *   - Client: to type-check factory function parameters in move-templates.ts
 */

// ── Template config interfaces ───────────────────────────────────────────

export interface ProjectileConfig {
  /** CDN sprite name (e.g. 'fireball', 'icicle') */
  sprite: string;
  /** CSS color for sprite tint */
  tint?: string;
  /** Overlay flash color (rgba) */
  flash?: string;
  /** Sprite size in px (default 40) */
  size?: number;
  /** Travel duration in seconds (default 0.3) */
  speed?: number;
  /** Cubic bezier easing curve (default ACCEL) */
  ease?: readonly [number, number, number, number];
  /** Defender knockback in px (default 6) */
  recoil?: number;
  /** Attacker scale pulse before firing (default true) */
  chargeUp?: boolean;
}

export interface LungeConfig {
  /** Fraction of the gap to close (default 0.35) */
  distance?: number;
  /** Number of hits (default 1) */
  hits?: number;
  /** Overlay flash color per hit */
  flash?: string;
  /** Attacker scale during lunge (default 1.1) */
  scale?: number;
  /** Defender knockback in px (default 8) */
  recoil?: number;
}

export interface AoeConfig {
  /** Screen shake intensity (default 4) */
  shake?: number;
  /** Shake duration in ms (default 400) */
  shakeDuration?: number;
  /** Overlay flash color */
  flash?: string;
  /** Defender knockback in px (default 4) */
  recoil?: number;
}

export interface SelfBuffConfig {
  /** Overlay flash color */
  flash?: string;
  /** Number of scale pulses (default 1) */
  pulses?: number;
  /** Peak scale (default 1.08) */
  scale?: number;
  /** Add rotation wobble (default false) */
  rotate?: boolean;
}

export interface StatusEffectConfig {
  /** Overlay flash color */
  flash?: string;
  /** Defender scale dip (default 0.97) */
  defenderShrink?: number;
}

// ── Discriminated union ──────────────────────────────────────────────────

export type MoveAnimConfig =
  | { template: 'projectile'; config: ProjectileConfig }
  | { template: 'lunge'; config?: LungeConfig }
  | { template: 'aoe'; config?: AoeConfig }
  | { template: 'selfBuff'; config?: SelfBuffConfig }
  | { template: 'statusEffect'; config?: StatusEffectConfig };
