/**
 * Server-side move animation catalog.
 *
 * Maps normalized move names to animation template configs.
 * Only the configs for moves in a given battle are sent to the client
 * via the BATTLE_START event — the client never downloads the full catalog.
 */

import type { MoveAnimConfig } from '@pokehub/shared/pokemon-battle-types';
import { unpackTeam } from '@pokehub/shared/pokemon-showdown-validation';

// ── Catalog ──────────────────────────────────────────────────────────────

const catalog = new Map<string, MoveAnimConfig>([
  // ── Fire ─────────────────────────────────────────────────────────────
  ['fireblast',       { template: 'projectile', config: { sprite: 'flareball', tint: '#ff3300', flash: 'rgba(255,80,0,0.18)', size: 56, speed: 0.28 } }],
  ['overheat',        { template: 'projectile', config: { sprite: 'flareball', tint: '#ff2200', flash: 'rgba(255,50,0,0.2)', size: 52, speed: 0.25 } }],
  ['firepunch',       { template: 'lunge', config: { flash: 'rgba(255,100,0,0.15)' } }],
  ['flareblitz',      { template: 'lunge', config: { distance: 0.5, flash: 'rgba(255,80,0,0.2)', scale: 1.15 } }],
  ['heatwave',        { template: 'aoe', config: { flash: 'rgba(255,100,0,0.15)', shake: 3 } }],
  ['lavaplume',       { template: 'aoe', config: { flash: 'rgba(255,80,0,0.15)', shake: 3 } }],
  ['fierydance',      { template: 'selfBuff', config: { flash: 'rgba(255,80,0,0.15)', pulses: 2, rotate: true } }],
  ['eruption',        { template: 'aoe', config: { flash: 'rgba(255,60,0,0.2)', shake: 6, shakeDuration: 500 } }],
  ['blazekick',       { template: 'lunge', config: { flash: 'rgba(255,100,0,0.15)' } }],
  ['sacredfire',      { template: 'projectile', config: { sprite: 'flareball', tint: '#ff6600', flash: 'rgba(255,100,0,0.2)', size: 52 } }],

  // ── Water ────────────────────────────────────────────────────────────
  ['hydropump',       { template: 'projectile', config: { sprite: 'waterwisp', tint: '#2288ff', flash: 'rgba(50,130,255,0.18)', size: 52, speed: 0.25 } }],
  ['waterfall',       { template: 'lunge', config: { flash: 'rgba(80,160,255,0.15)' } }],
  ['aquajet',         { template: 'lunge', config: { distance: 0.45, flash: 'rgba(80,180,255,0.12)' } }],
  ['liquidation',     { template: 'lunge', config: { flash: 'rgba(60,140,255,0.18)' } }],
  ['flipturn',        { template: 'lunge', config: { distance: 0.5, flash: 'rgba(80,180,255,0.12)' } }],
  ['muddywater',      { template: 'aoe', config: { flash: 'rgba(139,90,43,0.15)', shake: 3 } }],
  ['originpulse',     { template: 'aoe', config: { flash: 'rgba(50,130,255,0.2)', shake: 5, shakeDuration: 500 } }],
  ['waterspout',      { template: 'aoe', config: { flash: 'rgba(50,130,255,0.18)', shake: 5 } }],
  ['hydrocannon',     { template: 'projectile', config: { sprite: 'waterwisp', tint: '#1166ee', flash: 'rgba(40,100,255,0.2)', size: 56, speed: 0.25 } }],
  ['steamroller',     { template: 'lunge', config: { flash: 'rgba(80,160,255,0.12)' } }],

  // ── Electric ─────────────────────────────────────────────────────────
  ['thunder',         { template: 'aoe', config: { flash: 'rgba(255,220,0,0.2)', shake: 5, shakeDuration: 450 } }],
  ['voltswitch',      { template: 'lunge', config: { distance: 0.5, flash: 'rgba(255,220,0,0.15)' } }],
  ['wildcharge',      { template: 'lunge', config: { distance: 0.45, flash: 'rgba(255,220,0,0.18)', scale: 1.12 } }],
  ['discharge',       { template: 'aoe', config: { flash: 'rgba(255,220,0,0.18)', shake: 3 } }],
  ['thunderpunch',    { template: 'lunge', config: { flash: 'rgba(255,220,0,0.15)' } }],
  ['boltstrike',      { template: 'lunge', config: { distance: 0.5, flash: 'rgba(255,220,0,0.2)', scale: 1.15 } }],
  ['zapcannon',       { template: 'projectile', config: { sprite: 'electroball', tint: '#ffcc00', flash: 'rgba(255,220,0,0.2)', size: 52, speed: 0.28 } }],
  ['risingvoltage',   { template: 'projectile', config: { sprite: 'electroball', tint: '#ffdd00', flash: 'rgba(255,230,0,0.15)', size: 44 } }],

  // ── Grass ────────────────────────────────────────────────────────────
  ['energyball',      { template: 'projectile', config: { sprite: 'energyball', tint: '#44cc44', flash: 'rgba(60,200,60,0.15)' } }],
  ['leafstorm',       { template: 'aoe', config: { flash: 'rgba(60,180,60,0.18)', shake: 4, shakeDuration: 450 } }],
  ['gigadrain',       { template: 'projectile', config: { sprite: 'energyball', tint: '#33bb33', flash: 'rgba(50,180,50,0.12)', size: 36, speed: 0.35 } }],
  ['seedbomb',        { template: 'projectile', config: { sprite: 'energyball', tint: '#66aa22', flash: 'rgba(80,160,40,0.15)', size: 44 } }],
  ['leafblade',       { template: 'lunge', config: { flash: 'rgba(60,180,60,0.15)' } }],
  ['woodhammer',      { template: 'lunge', config: { distance: 0.45, flash: 'rgba(80,140,40,0.18)', scale: 1.12 } }],
  ['powerwhip',       { template: 'lunge', config: { flash: 'rgba(60,140,40,0.15)' } }],
  ['grassknot',       { template: 'statusEffect', config: { flash: 'rgba(60,180,60,0.15)' } }],
  ['sleeppowder',     { template: 'statusEffect', config: { flash: 'rgba(100,200,100,0.2)' } }],
  ['spore',           { template: 'statusEffect', config: { flash: 'rgba(100,200,100,0.25)' } }],
  ['leechseed',       { template: 'statusEffect', config: { flash: 'rgba(60,160,60,0.18)' } }],
  ['synthesis',       { template: 'selfBuff', config: { flash: 'rgba(60,200,60,0.15)' } }],

  // ── Ice ──────────────────────────────────────────────────────────────
  ['blizzard',        { template: 'aoe', config: { flash: 'rgba(130,200,255,0.2)', shake: 4, shakeDuration: 500 } }],
  ['freezedry',       { template: 'projectile', config: { sprite: 'icicle', tint: '#88ddff', flash: 'rgba(130,220,255,0.18)' } }],
  ['icecrash',        { template: 'lunge', config: { flash: 'rgba(130,200,255,0.18)', scale: 1.12 } }],
  ['icepunch',        { template: 'lunge', config: { flash: 'rgba(130,200,255,0.15)' } }],
  ['iceshard',        { template: 'projectile', config: { sprite: 'icicle', tint: '#88ccff', flash: 'rgba(130,200,255,0.12)', size: 32, speed: 0.2 } }],
  ['glaciate',        { template: 'aoe', config: { flash: 'rgba(130,200,255,0.2)', shake: 3 } }],
  ['auroraveil',      { template: 'selfBuff', config: { flash: 'rgba(130,220,255,0.2)' } }],

  // ── Fighting ─────────────────────────────────────────────────────────
  ['focusblast',      { template: 'projectile', config: { sprite: 'energyball', tint: '#cc6622', flash: 'rgba(200,100,30,0.18)', size: 48 } }],
  ['aurasphere',      { template: 'projectile', config: { sprite: 'energyball', tint: '#4488ff', flash: 'rgba(60,120,255,0.15)', size: 44 } }],
  ['drainpunch',      { template: 'lunge', config: { flash: 'rgba(100,200,100,0.12)' } }],
  ['machpunch',       { template: 'lunge', config: { distance: 0.4, flash: 'rgba(255,255,255,0.1)' } }],
  ['superpower',      { template: 'lunge', config: { distance: 0.45, flash: 'rgba(255,255,255,0.18)', scale: 1.15 } }],
  ['bodypress',       { template: 'lunge', config: { distance: 0.4, flash: 'rgba(255,255,255,0.15)', scale: 1.12 } }],
  ['brickbreak',      { template: 'lunge', config: { flash: 'rgba(255,255,255,0.12)' } }],
  ['highjumpkick',    { template: 'lunge', config: { distance: 0.5, flash: 'rgba(255,255,255,0.18)', scale: 1.12 } }],
  ['sacredsword',     { template: 'lunge', config: { flash: 'rgba(255,255,255,0.15)' } }],
  ['bulkup',          { template: 'selfBuff', config: { flash: 'rgba(200,100,30,0.15)', pulses: 2 } }],

  // ── Poison ───────────────────────────────────────────────────────────
  ['sludgebomb',      { template: 'projectile', config: { sprite: 'poisonwisp', tint: '#aa44cc', flash: 'rgba(160,50,220,0.15)', size: 44 } }],
  ['sludgewave',      { template: 'aoe', config: { flash: 'rgba(160,50,220,0.18)', shake: 3 } }],
  ['gunkshot',        { template: 'projectile', config: { sprite: 'poisonwisp', tint: '#8833aa', flash: 'rgba(140,40,200,0.18)', size: 48, speed: 0.25 } }],
  ['poisonjab',       { template: 'lunge', config: { flash: 'rgba(160,50,220,0.15)' } }],
  ['toxicspikes',     { template: 'statusEffect', config: { flash: 'rgba(160,50,220,0.15)' } }],
  ['venoshock',       { template: 'projectile', config: { sprite: 'poisonwisp', tint: '#aa44cc', flash: 'rgba(160,50,220,0.12)' } }],
  ['coil',            { template: 'selfBuff', config: { flash: 'rgba(160,50,220,0.15)', pulses: 2 } }],

  // ── Ground ───────────────────────────────────────────────────────────
  ['earthpower',      { template: 'aoe', config: { flash: 'rgba(180,140,60,0.18)', shake: 4 } }],
  ['precipiceblades', { template: 'aoe', config: { flash: 'rgba(180,60,30,0.2)', shake: 7, shakeDuration: 500 } }],
  ['bulldoze',        { template: 'aoe', config: { flash: 'rgba(160,120,50,0.15)', shake: 3 } }],
  ['mudshot',         { template: 'projectile', config: { sprite: 'mudwisp', tint: '#997744', flash: 'rgba(140,100,40,0.12)' } }],
  ['scorchingsands',  { template: 'projectile', config: { sprite: 'mudwisp', tint: '#cc8833', flash: 'rgba(200,130,50,0.15)' } }],
  ['highhorsepower',  { template: 'lunge', config: { distance: 0.45, flash: 'rgba(160,120,50,0.15)', scale: 1.12 } }],

  // ── Flying ───────────────────────────────────────────────────────────
  ['hurricane',       { template: 'aoe', config: { flash: 'rgba(180,200,220,0.18)', shake: 4, shakeDuration: 450 } }],
  ['bravebird',       { template: 'lunge', config: { distance: 0.55, flash: 'rgba(100,160,255,0.18)', scale: 1.15 } }],
  ['airslash',        { template: 'projectile', config: { sprite: 'wisp', tint: '#aaccee', flash: 'rgba(160,200,240,0.12)', size: 36 } }],
  ['aeroblast',       { template: 'projectile', config: { sprite: 'wisp', tint: '#88bbee', flash: 'rgba(130,180,240,0.18)', size: 48, speed: 0.25 } }],
  ['dualwingbeat',    { template: 'lunge', config: { hits: 2, flash: 'rgba(160,200,240,0.12)' } }],

  // ── Psychic ──────────────────────────────────────────────────────────
  ['psychic',         { template: 'projectile', config: { sprite: 'mistball', tint: '#ee66aa', flash: 'rgba(240,100,170,0.15)', size: 44 } }],
  ['psyshock',        { template: 'projectile', config: { sprite: 'mistball', tint: '#dd55aa', flash: 'rgba(220,80,160,0.15)' } }],
  ['futuresight',     { template: 'projectile', config: { sprite: 'mistball', tint: '#cc88ee', flash: 'rgba(200,130,240,0.15)', size: 48, speed: 0.4 } }],
  ['expandingforce',  { template: 'aoe', config: { flash: 'rgba(240,100,170,0.18)', shake: 3 } }],
  ['zenheadbutt',     { template: 'lunge', config: { flash: 'rgba(240,100,170,0.12)' } }],
  ['psychocut',       { template: 'lunge', config: { flash: 'rgba(220,80,160,0.12)' } }],
  ['trickroom',       { template: 'selfBuff', config: { flash: 'rgba(200,130,240,0.2)' } }],
  ['lightscreen',     { template: 'selfBuff', config: { flash: 'rgba(240,220,100,0.18)' } }],
  ['reflect',         { template: 'selfBuff', config: { flash: 'rgba(240,200,100,0.18)' } }],

  // ── Bug ──────────────────────────────────────────────────────────────
  ['bugbuzz',         { template: 'projectile', config: { sprite: 'energyball', tint: '#88aa22', flash: 'rgba(130,170,30,0.15)', size: 36 } }],
  ['megahorn',        { template: 'lunge', config: { distance: 0.45, flash: 'rgba(130,170,30,0.15)', scale: 1.12 } }],
  ['xscissor',        { template: 'lunge', config: { hits: 2, flash: 'rgba(130,170,30,0.12)' } }],
  ['leechlife',       { template: 'lunge', config: { flash: 'rgba(100,200,100,0.12)' } }],
  ['firstimpression', { template: 'lunge', config: { distance: 0.5, flash: 'rgba(130,170,30,0.15)', scale: 1.12 } }],
  ['quiverdance',     { template: 'selfBuff', config: { flash: 'rgba(200,100,200,0.15)', pulses: 2, rotate: true } }],
  ['stickyweb',       { template: 'statusEffect', config: { flash: 'rgba(180,170,100,0.18)' } }],

  // ── Rock ─────────────────────────────────────────────────────────────
  ['stoneedge',       { template: 'lunge', config: { flash: 'rgba(180,140,80,0.18)', scale: 1.12 } }],
  ['rockslide',       { template: 'aoe', config: { flash: 'rgba(180,140,80,0.15)', shake: 4 } }],
  ['headsmash',       { template: 'lunge', config: { distance: 0.5, flash: 'rgba(180,140,80,0.2)', scale: 1.15 } }],
  ['powergem',        { template: 'projectile', config: { sprite: 'energyball', tint: '#cc4444', flash: 'rgba(200,60,60,0.12)', size: 36 } }],
  ['diamondstorm',    { template: 'aoe', config: { flash: 'rgba(200,180,220,0.2)', shake: 5 } }],
  ['shellsmash',      { template: 'selfBuff', config: { flash: 'rgba(200,100,50,0.18)', pulses: 2 } }],

  // ── Ghost ────────────────────────────────────────────────────────────
  ['hex',             { template: 'projectile', config: { sprite: 'shadowball', tint: '#7744aa', flash: 'rgba(100,50,160,0.15)' } }],
  ['poltergeist',     { template: 'lunge', config: { flash: 'rgba(100,50,160,0.18)', scale: 1.12 } }],
  ['phantomforce',    { template: 'lunge', config: { distance: 0.5, flash: 'rgba(80,40,140,0.2)', scale: 1.15 } }],
  ['shadowclaw',      { template: 'lunge', config: { flash: 'rgba(100,50,160,0.15)' } }],
  ['shadowsneak',     { template: 'lunge', config: { distance: 0.4, flash: 'rgba(80,40,140,0.1)' } }],
  ['spectralthief',   { template: 'lunge', config: { flash: 'rgba(100,50,160,0.15)' } }],
  ['astralbarrage',   { template: 'aoe', config: { flash: 'rgba(100,50,160,0.2)', shake: 5 } }],

  // ── Dragon ───────────────────────────────────────────────────────────
  ['dragonpulse',     { template: 'projectile', config: { sprite: 'energyball', tint: '#6644cc', flash: 'rgba(100,60,200,0.15)', size: 44 } }],
  ['outrage',         { template: 'lunge', config: { distance: 0.5, hits: 2, flash: 'rgba(100,60,200,0.18)', scale: 1.15 } }],
  ['dragonclaw',      { template: 'lunge', config: { flash: 'rgba(100,60,200,0.15)' } }],
  ['dragonrush',      { template: 'lunge', config: { distance: 0.5, flash: 'rgba(100,60,200,0.18)', scale: 1.15 } }],
  ['scaleshot',       { template: 'projectile', config: { sprite: 'energyball', tint: '#5533bb', flash: 'rgba(80,50,180,0.12)', size: 32, speed: 0.2 } }],
  ['clangingscales',  { template: 'aoe', config: { flash: 'rgba(100,60,200,0.18)', shake: 4 } }],

  // ── Dark ─────────────────────────────────────────────────────────────
  ['darkpulse',       { template: 'projectile', config: { sprite: 'blackwisp', tint: '#443366', flash: 'rgba(50,30,80,0.18)', size: 44 } }],
  ['nightslash',      { template: 'lunge', config: { flash: 'rgba(50,30,80,0.15)' } }],
  ['crunch',          { template: 'lunge', config: { flash: 'rgba(50,30,80,0.18)' } }],
  ['suckerpunch',     { template: 'lunge', config: { distance: 0.45, flash: 'rgba(50,30,80,0.12)' } }],
  ['foulplay',        { template: 'lunge', config: { flash: 'rgba(50,30,80,0.15)' } }],
  ['pursuit',         { template: 'lunge', config: { distance: 0.4, flash: 'rgba(50,30,80,0.1)' } }],
  ['wickedblow',      { template: 'lunge', config: { flash: 'rgba(50,30,80,0.18)' } }],
  ['taunt',           { template: 'statusEffect', config: { flash: 'rgba(50,30,80,0.18)' } }],
  ['nastyplot',       { template: 'selfBuff', config: { flash: 'rgba(50,30,80,0.15)', pulses: 2 } }],

  // ── Steel ────────────────────────────────────────────────────────────
  ['flashcannon',     { template: 'projectile', config: { sprite: 'energyball', tint: '#aabbcc', flash: 'rgba(180,200,220,0.18)', size: 44 } }],
  ['ironhead',        { template: 'lunge', config: { flash: 'rgba(180,200,220,0.15)' } }],
  ['bulletpunch',     { template: 'lunge', config: { distance: 0.4, flash: 'rgba(180,200,220,0.12)' } }],
  ['meteormash',      { template: 'lunge', config: { distance: 0.45, flash: 'rgba(180,200,220,0.18)', scale: 1.12 } }],
  ['steelbeam',       { template: 'projectile', config: { sprite: 'energyball', tint: '#8899aa', flash: 'rgba(160,180,200,0.2)', size: 52, speed: 0.25 } }],
  ['heavyslam',       { template: 'lunge', config: { distance: 0.45, flash: 'rgba(160,180,200,0.18)', scale: 1.15 } }],
  ['geargrind',       { template: 'lunge', config: { hits: 2, flash: 'rgba(180,200,220,0.12)' } }],
  ['irondefense',     { template: 'selfBuff', config: { flash: 'rgba(180,200,220,0.2)' } }],
  ['shiftgear',       { template: 'selfBuff', config: { flash: 'rgba(180,200,220,0.18)', pulses: 2 } }],
  ['autotomize',      { template: 'selfBuff', config: { flash: 'rgba(200,220,240,0.15)' } }],

  // ── Fairy ────────────────────────────────────────────────────────────
  ['dazzlinggleam',   { template: 'aoe', config: { flash: 'rgba(255,180,220,0.2)', shake: 2 } }],
  ['playrough',       { template: 'lunge', config: { flash: 'rgba(255,180,220,0.15)' } }],
  ['drainingkiss',    { template: 'lunge', config: { flash: 'rgba(255,150,200,0.12)' } }],
  ['moonlight',       { template: 'selfBuff', config: { flash: 'rgba(200,200,255,0.18)' } }],
  ['fleurcannon',     { template: 'projectile', config: { sprite: 'mistball', tint: '#ff88cc', flash: 'rgba(255,130,200,0.18)', size: 48, speed: 0.25 } }],
  ['spiritbreak',     { template: 'lunge', config: { flash: 'rgba(255,180,220,0.15)', scale: 1.12 } }],

  // ── Normal ───────────────────────────────────────────────────────────
  ['bodyslam',        { template: 'lunge', config: { flash: 'rgba(200,200,200,0.15)', scale: 1.12 } }],
  ['doubleedge',      { template: 'lunge', config: { distance: 0.5, flash: 'rgba(200,200,200,0.18)', scale: 1.15 } }],
  ['extremespeed',    { template: 'lunge', config: { distance: 0.55, flash: 'rgba(255,255,255,0.12)' } }],
  ['facade',          { template: 'lunge', config: { flash: 'rgba(200,100,50,0.15)' } }],
  ['hypervoice',      { template: 'aoe', config: { flash: 'rgba(200,200,200,0.15)', shake: 3 } }],
  ['boomburst',       { template: 'aoe', config: { flash: 'rgba(200,200,200,0.2)', shake: 5, shakeDuration: 450 } }],
  ['rapidspin',       { template: 'selfBuff', config: { flash: 'rgba(200,200,200,0.12)', rotate: true } }],
  ['return',          { template: 'lunge', config: { flash: 'rgba(255,180,200,0.12)' } }],
  ['frustration',     { template: 'lunge', config: { flash: 'rgba(200,50,50,0.12)' } }],
  ['gigaimpact',      { template: 'lunge', config: { distance: 0.55, flash: 'rgba(255,200,50,0.2)', scale: 1.18 } }],
  ['hyperbeam',       { template: 'projectile', config: { sprite: 'energyball', tint: '#ffaa22', flash: 'rgba(255,180,40,0.2)', size: 52, speed: 0.25 } }],
  ['wish',            { template: 'selfBuff', config: { flash: 'rgba(255,255,200,0.18)' } }],
  ['healbell',        { template: 'selfBuff', config: { flash: 'rgba(200,255,200,0.15)' } }],

  // ── Cross-type utility ───────────────────────────────────────────────
  ['spikes',          { template: 'statusEffect', config: { flash: 'rgba(180,140,80,0.18)' } }],
  ['thunderwave',     { template: 'statusEffect', config: { flash: 'rgba(234,179,8,0.25)' } }],
  ['stunspore',       { template: 'statusEffect', config: { flash: 'rgba(234,179,8,0.2)' } }],
  ['glare',           { template: 'statusEffect', config: { flash: 'rgba(200,200,100,0.2)' } }],
  ['yawn',            { template: 'statusEffect', config: { flash: 'rgba(200,180,220,0.2)', defenderShrink: 0.95 } }],
  ['encore',          { template: 'statusEffect', config: { flash: 'rgba(255,180,220,0.15)' } }],
  ['whirlwind',       { template: 'aoe', config: { flash: 'rgba(200,220,240,0.15)', shake: 2 } }],
  ['haze',            { template: 'aoe', config: { flash: 'rgba(180,200,220,0.2)', shake: 1 } }],
  ['trick',           { template: 'statusEffect', config: { flash: 'rgba(200,130,240,0.15)' } }],
  ['switcheroo',      { template: 'statusEffect', config: { flash: 'rgba(200,130,240,0.15)' } }],
  ['agility',         { template: 'selfBuff', config: { flash: 'rgba(240,100,170,0.12)' } }],
  ['tailwind',        { template: 'selfBuff', config: { flash: 'rgba(200,220,240,0.18)' } }],
  ['stealthrock',     { template: 'statusEffect', config: { flash: 'rgba(180,140,80,0.18)' } }],
  ['recover',         { template: 'selfBuff', config: { flash: 'rgba(100,200,255,0.18)' } }],
  ['softboiled',      { template: 'selfBuff', config: { flash: 'rgba(255,220,200,0.15)' } }],
  ['morningsun',      { template: 'selfBuff', config: { flash: 'rgba(255,220,100,0.18)' } }],
  ['painsplit',       { template: 'statusEffect', config: { flash: 'rgba(180,100,100,0.15)' } }],
  ['teleport',        { template: 'selfBuff', config: { flash: 'rgba(200,130,240,0.15)' } }],
  ['uturn',           { template: 'lunge', config: { distance: 0.5, flash: 'rgba(144,238,144,0.15)' } }],
  ['honeclaws',       { template: 'selfBuff', config: { flash: 'rgba(200,50,50,0.12)', pulses: 2 } }],
  ['cosmicpower',     { template: 'selfBuff', config: { flash: 'rgba(200,200,255,0.18)' } }],
  ['substitute',      { template: 'selfBuff', config: { flash: 'rgba(200,200,200,0.15)' } }],
  ['protect',         { template: 'selfBuff', config: { flash: 'rgba(100,255,100,0.18)' } }],
]);

// ── Helpers ──────────────────────────────────────────────────────────────

function normalizeMoveName(name: string): string {
  return name.toLowerCase().replace(/[\s-]/g, '');
}

/**
 * Extract all move names from a packed team string.
 */
export function extractMoveNames(packedTeam: string): string[] {
  const team = unpackTeam(packedTeam);
  if (!team) return [];
  return team.flatMap(p => p.moves ?? []);
}

/**
 * Look up animation configs for a list of move names.
 * Returns only moves that have catalog entries (others use generic fallbacks).
 */
export function getMoveAnimConfigs(moveNames: string[]): Record<string, MoveAnimConfig> {
  const result: Record<string, MoveAnimConfig> = {};
  for (const name of moveNames) {
    const key = normalizeMoveName(name);
    const entry = catalog.get(key);
    if (entry) result[key] = entry;
  }
  return result;
}
