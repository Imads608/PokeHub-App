/**
 * One-time script to upload Pokemon SFX audio files to Azure Blob Storage.
 *
 * Prerequisites: `az login` (uses DefaultAzureCredential)
 *
 * Usage:
 *   npx tsx tools/upload-audio-assets.ts
 *
 * Scans GEN 7 directory first, falls back to GEN 6/5/4/3 for missing moves.
 * Picks one file per move (base file, skips "part N" and multi-hit variants).
 * Normalizes filenames to lowercase with hyphens.
 * Uploads to Azure Blob container "audio" under moves/ and sfx/ prefixes.
 */

import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import { readdirSync, readFileSync } from 'fs';
import { join, extname, basename } from 'path';

// ── Configuration ────────────────────────────────────────────────────────

const SFX_ROOT =
  '/home/imad/Documents/Pokemon SFX Attack Moves & Sound Effects Collection';

const CONTAINER_NAME = 'audio';

/** Gen directories in priority order (highest gen first). */
const GEN_DIRS = [
  'GEN 7 SFX - Attack Moves - SUMO, USUM',
  'GEN 6 SFX - Attack Moves - XY, ORAS',
  'GEN 5 SFX - Attack Moves - BLK, WHT, BLK2, WHT2',
  'GEN 4 SFX - Attack Moves - DPPL, HG, SS',
  'GEN 3 SFX - Attack Moves - RSE, FR, LG',
  // GEN 1-2 are WAV — skip unless needed
];

/** Root-level special effect files → blob path. */
const SFX_FILES: Record<string, string> = {
  'hit-super-effective.mp3': 'sfx/hit-super-effective.mp3',
  'hit-weak-not-very-effective.mp3': 'sfx/hit-weak-not-very-effective.mp3',
  'In-Battle_Faint_No_Health.mp3': 'sfx/faint.mp3',
  'low-hp-pokemon.mp3': 'sfx/low-hp-pokemon.mp3',
  'stats_up.wav': 'sfx/stat-up.wav',
  'stats_down.wav': 'sfx/stat-down.wav',
};

// ── Helpers ──────────────────────────────────────────────────────────────

/** Normalize a move filename to a blob-friendly key. */
function normalizeMoveName(fileName: string): string {
  const name = basename(fileName, extname(fileName));
  // Convert "Title Case" to "title-case", preserve existing hyphens
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2') // CamelCase → Camel-Case (GEN 1-2)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/** Returns true if the file is a "part N", multi-hit, or hit variant. */
function isVariant(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return (
    /part \d/.test(lower) ||
    /\dhit/.test(lower) ||
    /\dhits/.test(lower) ||
    lower.startsWith('hit ')
  );
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || 'pokehub';

  const credential = new DefaultAzureCredential();
  const client = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );
  const container = client.getContainerClient(CONTAINER_NAME);
  await container.createIfNotExists({ access: 'blob' }); // public read

  // ── 1. Build move map (first match wins = highest gen) ──────────────

  const moveMap = new Map<string, string>(); // normalizedName → filePath

  for (const genDir of GEN_DIRS) {
    const dirPath = join(SFX_ROOT, genDir);
    let files: string[];
    try {
      files = readdirSync(dirPath);
    } catch {
      console.warn(`Skipping missing directory: ${genDir}`);
      continue;
    }

    for (const file of files) {
      if (extname(file).toLowerCase() !== '.mp3') continue;
      if (isVariant(file)) continue;

      const key = normalizeMoveName(file);
      if (!key) continue;
      if (moveMap.has(key)) continue; // higher gen already found

      moveMap.set(key, join(dirPath, file));
    }
  }

  console.log(`Found ${moveMap.size} unique moves across all generations.`);

  // ── 2. Upload move files ────────────────────────────────────────────

  let uploaded = 0;
  let failed = 0;

  for (const [key, filePath] of moveMap) {
    const blobName = `moves/${key}.mp3`;
    try {
      const data = readFileSync(filePath);
      const blockBlob = container.getBlockBlobClient(blobName);
      await blockBlob.upload(data, data.length, {
        blobHTTPHeaders: { blobContentType: 'audio/mpeg' },
      });
      uploaded++;
      if (uploaded % 50 === 0) {
        console.log(`  Uploaded ${uploaded} moves...`);
      }
    } catch (err) {
      console.error(`  Failed: ${blobName} — ${err}`);
      failed++;
    }
  }

  console.log(`Moves: ${uploaded} uploaded, ${failed} failed.`);

  // ── 3. Upload special effect files ──────────────────────────────────

  let sfxUploaded = 0;
  for (const [localName, blobPath] of Object.entries(SFX_FILES)) {
    const filePath = join(SFX_ROOT, localName);
    try {
      const data = readFileSync(filePath);
      const ext = extname(localName).toLowerCase();
      const contentType = ext === '.wav' ? 'audio/wav' : 'audio/mpeg';
      const blockBlob = container.getBlockBlobClient(blobPath);
      await blockBlob.upload(data, data.length, {
        blobHTTPHeaders: { blobContentType: contentType },
      });
      console.log(`  SFX: ${localName} → ${blobPath}`);
      sfxUploaded++;
    } catch (err) {
      console.error(`  SFX failed: ${localName} — ${err}`);
    }
  }

  console.log(`SFX: ${sfxUploaded}/${Object.keys(SFX_FILES).length} uploaded.`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
