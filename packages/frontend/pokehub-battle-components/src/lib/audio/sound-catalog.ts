const AZURE_AUDIO = 'https://pokehub.blob.core.windows.net/audio';
const SHOWDOWN_AUDIO = '/api/audio';

// ── State event SFX (Azure Blob Storage) ────────────────────────────────

export const STATE_SFX = {
  supereffective: `${AZURE_AUDIO}/sfx/hit-super-effective.mp3`,
  resisted: `${AZURE_AUDIO}/sfx/hit-weak-not-very-effective.mp3`,
  faint: `${AZURE_AUDIO}/sfx/faint.mp3`,
  boost: `${AZURE_AUDIO}/sfx/stat-up.wav`,
  unboost: `${AZURE_AUDIO}/sfx/stat-down.wav`,
  // These SFX are not in the local collection — playSfx silently skips 404s
  switchOut: `${SHOWDOWN_AUDIO}/cries/pokeball.mp3`,
  switchIn: `${SHOWDOWN_AUDIO}/cries/pokeball.mp3`,
  damage: `${AZURE_AUDIO}/sfx/normal-hit.wav`,
  status: `${AZURE_AUDIO}/sfx/hit-weak-not-very-effective.mp3`,
} as const;

// ── BGM tracks (from Showdown CDN via proxy) ────────────────────────────

export const BGM_TRACKS = [
  `${SHOWDOWN_AUDIO}/bw-trainer.mp3`,
  `${SHOWDOWN_AUDIO}/bw2-rival.mp3`,
  `${SHOWDOWN_AUDIO}/xy-trainer.mp3`,
  `${SHOWDOWN_AUDIO}/xy-rival.mp3`,
  `${SHOWDOWN_AUDIO}/oras-trainer.mp3`,
  `${SHOWDOWN_AUDIO}/sm-trainer.mp3`,
  `${SHOWDOWN_AUDIO}/sm-rival.mp3`,
  `${SHOWDOWN_AUDIO}/dpp-trainer.mp3`,
  `${SHOWDOWN_AUDIO}/dpp-rival.mp3`,
  `${SHOWDOWN_AUDIO}/hgss-johto-trainer.mp3`,
  `${SHOWDOWN_AUDIO}/hgss-kanto-trainer.mp3`,
] as const;

// ── Pokemon cries (from Showdown CDN via proxy) ─────────────────────────

export function getCryUrl(speciesId: string): string {
  return `${SHOWDOWN_AUDIO}/cries/${speciesId.toLowerCase()}.mp3`;
}

// ── Per-move SFX (Azure Blob Storage — 750 moves) ──────────────────────

/**
 * Returns the Azure Blob URL for a move's SFX.
 * Every move has its own file at moves/{normalized-name}.mp3.
 * BattleAudioManager silently skips 404s for any missing moves.
 */
export function getMoveSfxUrl(moveName: string): string {
  const key = moveName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  return `${AZURE_AUDIO}/moves/${key}.mp3`;
}
