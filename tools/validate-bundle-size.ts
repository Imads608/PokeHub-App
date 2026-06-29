#!/usr/bin/env npx tsx

/**
 * Accurate per-route bundle size validation for Next.js App Router.
 *
 * Statoscope's `entry-download-size-limits` rule recursively walks chunk
 * children and uses webpack's global `initial` flag, which inflates sizes
 * for App Router apps (see https://github.com/statoscope/statoscope/issues/256).
 *
 * This script computes the real initial bundle for each route by summing
 * the deduplicated gzipped assets from: main + main-app + layout chain + page.
 *
 * Routes and layout chains are auto-discovered from the stats JSON entrypoints.
 *
 * Usage:
 *   npx tsx tools/validate-bundle-size.ts <stats-json> [--reference <main-stats-json>]
 *
 * Exit code 1 on failure.
 */

import { readFileSync, existsSync } from 'fs';

// ── Types ──────────────────────────────────────────────────────────────────

interface StatsAsset {
  name: string;
  size: number;
}

interface StatsEntrypoint {
  assets: StatsAsset[];
  chunks: number[];
}

interface CompressedResource {
  id: string;
  size: { compressor: string; size: number; meta: { level: number } };
}

interface StatoscopeExtension {
  descriptor?: { name: string };
  payload: {
    compilations: Array<{
      id: string;
      resources: CompressedResource[];
    }>;
  };
}

interface WebpackStats {
  entrypoints: Record<string, StatsEntrypoint>;
  __statoscope?: {
    extensions?: StatoscopeExtension[];
  };
}

interface RouteResult {
  path: string;
  layers: string[];
  size: number;
  refSize: number | null;
}

// ── Configuration ──────────────────────────────────────────────────────────

/** Maximum gzipped initial bundle size per route (bytes). */
const MAX_ROUTE_SIZE = 550 * 1024; // 550 KB

/** Maximum gzipped size increase per route vs reference (bytes). */
const MAX_ROUTE_DIFF = 10 * 1024; // 10 KB

// ── Helpers ─────────────────────────────────────────────────────────────────

function loadStats(filePath: string): WebpackStats {
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as WebpackStats;
}

function buildGzipMap(stats: WebpackStats): Record<string, number> {
  const ext = stats.__statoscope?.extensions?.find(
    (e) => e.descriptor?.name === '@statoscope/stats-extension-compressed'
  );
  if (!ext) {
    console.error('Error: stats file missing compressed size extension.');
    console.error('Rebuild with ANALYZE=true to generate compressed sizes.');
    process.exit(1);
  }
  const map: Record<string, number> = {};
  for (const r of ext.payload.compilations[0].resources) {
    map[r.id] = r.size.size;
  }
  return map;
}

function getSharedAssetNames(stats: WebpackStats): Set<string> {
  const names = new Set<string>();
  for (const ep of ['main', 'main-app'] as const) {
    const entry = stats.entrypoints[ep];
    if (entry) {
      for (const asset of entry.assets) {
        names.add(asset.name);
      }
    }
  }
  return names;
}

/**
 * Auto-discover routes and their layout chains from stats entrypoints.
 *
 * For a page entrypoint like `app/pokedex/[id]/page`, the layout chain is
 * built by walking up directory segments looking for layout entrypoints:
 *   → app/layout, app/pokedex/layout
 */
function discoverRoutes(stats: WebpackStats): Array<{ path: string; layers: string[] }> {
  const entryNames = Object.keys(stats.entrypoints);

  // Find all layout entrypoints
  const layoutEntries = new Set(entryNames.filter((n) => n.endsWith('/layout')));

  // Find all page entrypoints (skip internal Next.js pages)
  const pageEntries = entryNames.filter(
    (n) => n.startsWith('app/') && n.endsWith('/page') && !n.includes('_not-found') && !n.includes('_global-error')
  );

  return pageEntries.map((pageEntry) => {
    // e.g. "app/pokedex/[id]/page" → segments = ["app", "pokedex", "[id]", "page"]
    const segments = pageEntry.split('/');
    const layers: string[] = [];

    // Walk from root to parent of /page, collecting layout entrypoints
    for (let i = 1; i < segments.length; i++) {
      const prefix = segments.slice(0, i).join('/');
      const layoutEntry = prefix + '/layout';
      if (layoutEntries.has(layoutEntry)) {
        layers.push(layoutEntry);
      }
    }

    // Add the page itself
    layers.push(pageEntry);

    // Convert entrypoint name to a readable route path
    // "app/pokedex/[id]/page" → "/pokedex/[id]"
    const routePath =
      '/' +
      segments
        .slice(1, -1) // remove "app" prefix and "page" suffix
        .join('/');

    return { path: routePath || '/', layers };
  });
}

function computeRouteSize(
  stats: WebpackStats,
  gzipMap: Record<string, number>,
  sharedAssets: Set<string>,
  layers: string[]
): number {
  const allAssets = new Set(sharedAssets);
  for (const layer of layers) {
    const ep = stats.entrypoints[layer];
    if (ep) {
      for (const asset of ep.assets) {
        allAssets.add(asset.name);
      }
    }
  }
  let total = 0;
  for (const name of allAssets) {
    total += gzipMap[name] || 0;
  }
  return total;
}

function formatKB(bytes: number): string {
  return (bytes / 1024).toFixed(1) + ' KB';
}

// ── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error(
      'Usage: npx tsx tools/validate-bundle-size.ts <stats.json> [--reference <ref-stats.json>]'
    );
    process.exit(1);
  }

  const inputPath = args[0];
  const refIdx = args.indexOf('--reference');
  const refPath = refIdx !== -1 ? args[refIdx + 1] : null;

  // Load input stats
  const stats = loadStats(inputPath);
  const gzipMap = buildGzipMap(stats);
  const sharedAssets = getSharedAssetNames(stats);

  // Auto-discover routes from entrypoints
  const routes = discoverRoutes(stats);

  // Load reference stats (if provided)
  let refGzipMap: Record<string, number> | null = null;
  let refSharedAssets: Set<string> | null = null;
  let refStats: WebpackStats | null = null;
  if (refPath && existsSync(refPath)) {
    refStats = loadStats(refPath);
    refGzipMap = buildGzipMap(refStats);
    refSharedAssets = getSharedAssetNames(refStats);
  }

  // Compute sizes
  const results: RouteResult[] = [];
  for (const route of routes) {
    const size = computeRouteSize(stats, gzipMap, sharedAssets, route.layers);
    let refSize: number | null = null;
    if (refStats && refGzipMap && refSharedAssets) {
      // Only compare if the page entrypoint exists in the reference stats.
      // New routes won't have a baseline — skip diff check for those.
      const pageEntry = route.layers[route.layers.length - 1];
      if (refStats.entrypoints[pageEntry]) {
        refSize = computeRouteSize(refStats, refGzipMap, refSharedAssets, route.layers);
      }
    }
    results.push({ ...route, size, refSize });
  }

  // Sort by path for consistent output
  results.sort((a, b) => a.path.localeCompare(b.path));

  // Validate
  let hasErrors = false;
  const errors: string[] = [];

  console.log('');
  console.log('Route Bundle Size Validation (gzipped)');
  console.log('═'.repeat(70));

  if (refStats) {
    console.log(
      '  ' +
        'Route'.padEnd(28) +
        'Size'.padStart(10) +
        'Main'.padStart(10) +
        'Diff'.padStart(10) +
        '  Status'
    );
  } else {
    console.log('  ' + 'Route'.padEnd(28) + 'Size'.padStart(10) + '  Status');
  }
  console.log('─'.repeat(70));

  for (const r of results) {
    const routeErrors: string[] = [];

    // Check absolute limit
    if (r.size > MAX_ROUTE_SIZE) {
      routeErrors.push(
        `${r.path}: ${formatKB(r.size)} exceeds limit of ${formatKB(MAX_ROUTE_SIZE)}`
      );
    }

    // Check diff limit
    if (r.refSize !== null) {
      const diff = r.size - r.refSize;
      if (diff > MAX_ROUTE_DIFF) {
        routeErrors.push(
          `${r.path}: increased by ${formatKB(diff)} (limit: ${formatKB(MAX_ROUTE_DIFF)})`
        );
      }
    }

    if (routeErrors.length > 0) {
      hasErrors = true;
      errors.push(...routeErrors);
    }

    // Format output line
    const statusIcon = routeErrors.length > 0 ? 'FAIL' : 'pass';
    if (r.refSize !== null) {
      const diff = r.size - r.refSize;
      const diffStr = diff >= 0 ? `+${formatKB(diff)}` : `-${formatKB(Math.abs(diff))}`;
      console.log(
        '  ' +
          r.path.padEnd(28) +
          formatKB(r.size).padStart(10) +
          formatKB(r.refSize).padStart(10) +
          diffStr.padStart(10) +
          '  ' +
          statusIcon
      );
    } else if (refStats) {
      // Route exists in PR but not in reference — new route
      console.log(
        '  ' +
          r.path.padEnd(28) +
          formatKB(r.size).padStart(10) +
          '-'.padStart(10) +
          'new'.padStart(10) +
          '  ' +
          statusIcon
      );
    } else {
      console.log(
        '  ' + r.path.padEnd(28) + formatKB(r.size).padStart(10) + '  ' + statusIcon
      );
    }
  }

  console.log('─'.repeat(70));
  console.log(
    `  Limit: ${formatKB(MAX_ROUTE_SIZE)} per route | Max increase: ${formatKB(MAX_ROUTE_DIFF)}`
  );
  console.log('');

  if (hasErrors) {
    console.log('Errors:');
    for (const err of errors) {
      console.log(`  - ${err}`);
    }
    console.log('');
    process.exit(1);
  } else {
    console.log('All routes within limits.');
    console.log('');
  }
}

main();
