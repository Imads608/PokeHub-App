import { NextResponse } from 'next/server';

const SHOWDOWN_AUDIO_BASE = 'https://play.pokemonshowdown.com/audio';

/** Allowed prefixes to prevent arbitrary URL proxying. */
const ALLOWED_PREFIXES = [
  'cries/',
  'bw-',
  'bw2-',
  'xy-',
  'oras-',
  'sm-',
  'dpp-',
  'hgss-',
  'colosseum-',
  'xd-',
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = path.join('/');

  // Sanitize: no directory traversal, must match allowed prefix
  if (filePath.includes('..') || filePath.startsWith('/')) {
    return new NextResponse(null, { status: 400 });
  }
  if (!ALLOWED_PREFIXES.some((p) => filePath.startsWith(p))) {
    return new NextResponse(null, { status: 400 });
  }

  // Fetch from Showdown and stream through — browser caches via Cache-Control header
  const url = `${SHOWDOWN_AUDIO_BASE}/${filePath}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const contentType = filePath.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg';
    return new Response(response.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
