# Battle Audio System

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Audio Graph](#audio-graph)
  - [BattleAudioManager](#battleaudiomanager)
  - [AudioProvider Context](#audioprovider-context)
  - [useAudio Hook](#useaudio-hook)
- [Audio Sources](#audio-sources)
  - [BGM Tracks](#bgm-tracks)
  - [Pokemon Cries](#pokemon-cries)
  - [Move SFX](#move-sfx)
  - [State SFX](#state-sfx)
- [CORS Proxy](#cors-proxy)
  - [Why It Exists](#why-it-exists)
  - [Route Handler](#route-handler)
  - [Allowed Prefixes](#allowed-prefixes)
  - [Caching](#caching)
- [Autoplay Policy](#autoplay-policy)
- [Volume Controls](#volume-controls)
  - [UI Layout](#ui-layout)
  - [Persistence](#persistence)
- [Animation Integration](#animation-integration)
  - [Move SFX Sequencing](#move-sfx-sequencing)
  - [Effectiveness Tracking](#effectiveness-tracking)
  - [State Animation SFX](#state-animation-sfx)
- [Asset Upload Tool](#asset-upload-tool)
  - [Usage](#usage)
  - [Move SFX Resolution](#move-sfx-resolution)
  - [Special SFX Files](#special-sfx-files)
- [Related Documentation](#related-documentation)

---

## Overview

The battle audio system provides background music, move sound effects, Pokemon cries, and state event sounds during battles. It uses the Web Audio API for precise playback control and gain management, with audio assets sourced from Pokemon Showdown's CDN (via a CORS proxy) and Azure Blob Storage.

Audio is managed by a singleton `BattleAudioManager` class, exposed to React components through an `AudioProvider` context. Volume preferences persist in `localStorage` across sessions, and the system handles browser autoplay policies by resuming the `AudioContext` on user interaction.

## Architecture

### Audio Graph

The Web Audio API gain chain provides independent volume control for BGM and SFX:

```
  BGM source ──▶ bgmGain ──┐
                            ├──▶ masterGain ──▶ destination (speakers)
  SFX source ──▶ sfxGain ──┘
```

Each `GainNode` controls a volume channel:
- **`masterGain`** — overall volume (0–1), set to 0 when muted
- **`bgmGain`** — background music volume (0–1)
- **`sfxGain`** — sound effects volume (0–1)

### BattleAudioManager

`audio/battle-audio-manager.ts` — singleton class created once per battle via `AudioProvider`.

```typescript
class BattleAudioManager {
  // Playback
  resume(): Promise<void>;           // unlock suspended AudioContext
  playBgm(url: string): void;        // fetch, decode, loop BGM (skips if same URL)
  stopBgm(fadeMs?: number): void;    // stop BGM with optional linear fade
  playSfx(url: string): Promise<void>; // fetch, decode, play SFX; resolves on ended

  // Volume
  setMasterVolume(v: number): void;
  setBgmVolume(v: number): void;
  setSfxVolume(v: number): void;
  setMuted(m: boolean): void;

  // State
  get isUnlocked(): boolean;         // ctx.state === 'running'
  dispose(): void;                   // stop BGM, clear cache, close AudioContext
}
```

Key design decisions:

- **Buffer cache** — `Map<string, AudioBuffer>` prevents redundant network fetches and `decodeAudioData` calls for repeated sounds
- **Silent error handling** — all fetch/decode errors are caught and swallowed, so a missing audio file never breaks gameplay
- **Disposed guard** — a `disposed` flag prevents operations after cleanup
- **BGM deduplication** — `playBgm()` checks if the requested URL is already playing and skips if so

### AudioProvider Context

`audio/audio.context.tsx` — React context that wraps `BattleAudioManager` with reactive state mirrors.

```typescript
interface AudioContextValue {
  audio: BattleAudioManager;
  isUnlocked: boolean;
  isMuted: boolean;
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
  setMasterVolume: (v: number) => void;
  setBgmVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  toggleMute: () => void;
  unlock: () => Promise<void>;
}
```

The provider:
- Lazy-initializes the manager in a `useRef` (SSR-safe: guards on `typeof window !== 'undefined'`)
- Maintains reactive state mirrors (`isMuted`, `masterVolume`, etc.) that shadow the manager's imperative values for triggering re-renders
- Polls `manager.isUnlocked` every 500ms to detect when `AudioContext` transitions to `running`
- Calls `manager.dispose()` on unmount

### useAudio Hook

```typescript
const { audio, isUnlocked, isMuted, masterVolume, ... } = useAudio();
```

Throws if used outside `AudioProvider`. Animation functions receive the `audio` instance directly via the `playAnimationEvent` function signature.

## Audio Sources

### BGM Tracks

Background music sourced from Pokemon Showdown's CDN, proxied through the Next.js API route:

| Track | Source |
|-------|--------|
| `bw-trainer` | Black & White trainer battle |
| `bw2-rival` | Black 2 & White 2 rival battle |
| `xy-trainer` | X & Y trainer battle |
| `xy-rival` | X & Y rival battle |
| `oras-trainer` | Omega Ruby & Alpha Sapphire trainer |
| `sm-trainer` | Sun & Moon trainer battle |
| `sm-rival` | Sun & Moon rival battle |
| `dpp-trainer` | Diamond, Pearl & Platinum trainer |
| `dpp-rival` | Diamond, Pearl & Platinum rival |
| `hgss-johto-trainer` | HeartGold & SoulSilver Johto trainer |
| `hgss-kanto-trainer` | HeartGold & SoulSilver Kanto trainer |

A random track is selected per battle. URL format: `/api/audio/{track}.mp3`

### Pokemon Cries

Cries play on switch-in. Sourced from Showdown's CDN via the CORS proxy.

```
/api/audio/cries/{speciesId}.mp3
```

Species IDs are resolved through `@pkmn/dex` to handle base species correctly (e.g., Mega Charizard X resolves to `charizard`).

### Move SFX

Per-move sound effects stored in Azure Blob Storage. ~750 moves covered.

```
https://pokehub.blob.core.windows.net/audio/moves/{normalizedName}.mp3
```

Move names are normalized: camelCase to hyphen-separated, lowercased, spaces to hyphens, non-alphanumeric characters stripped. Missing moves (404) are silently skipped.

### State SFX

Sound effects for battle state events, stored in Azure Blob Storage:

| Event | File | Source |
|-------|------|--------|
| Super effective hit | `sfx/hit-super-effective.mp3` | Azure Blob |
| Not very effective hit | `sfx/hit-weak-not-very-effective.mp3` | Azure Blob |
| Normal hit (damage) | `sfx/normal-hit.wav` | Azure Blob |
| Faint | `sfx/faint.mp3` | Azure Blob |
| Stat boost | `sfx/stat-up.wav` | Azure Blob |
| Stat drop | `sfx/stat-down.wav` | Azure Blob |
| Status condition | `sfx/hit-weak-not-very-effective.mp3` | Azure Blob |
| Switch in/out | `cries/pokeball.mp3` | Showdown proxy |

## CORS Proxy

### Why It Exists

Pokemon Showdown's CDN (`play.pokemonshowdown.com`) blocks cross-origin requests. The Web Audio API requires CORS-enabled responses to decode audio via `decodeAudioData`. A server-side proxy bypasses this limitation.

### Route Handler

`apps/pokehub-app/app/api/audio/[...path]/route.ts` — Next.js Route Handler that fetches audio from Showdown and serves it to the client.

```
  Client                     Next.js API Route              Showdown CDN
    │                              │                              │
    │  GET /api/audio/cries/x.mp3  │                              │
    │─────────────────────────────▶│                              │
    │                              │  GET /audio/cries/x.mp3      │
    │                              │─────────────────────────────▶│
    │                              │◀─────────────────────────────│
    │  audio/mpeg (CORS OK)        │                              │
    │◀─────────────────────────────│                              │
```

### Allowed Prefixes

Path segments must start with one of these prefixes (rejects all others):

```
cries/    bw-      bw2-     xy-      oras-
sm-       dpp-     hgss-    colosseum-   xd-
```

Additional security: rejects `..` (directory traversal) and leading `/`.

### Caching

- **In-memory** — `Map<string, ArrayBuffer>` with process-lifetime TTL (no expiry). Prevents repeated fetches to Showdown.
- **HTTP** — `Cache-Control: public, max-age=604800, immutable` (7 days). Browser caches the proxied response.

Response `Content-Type` is `audio/mpeg` (default) or `audio/ogg` for `.ogg` files.

Error responses: `400` (bad path), `404` (Showdown returned non-OK), `502` (fetch error).

## Autoplay Policy

Modern browsers suspend `AudioContext` until a user gesture occurs. The system handles this:

```
  Page loads
      │
      ▼
  AudioContext created (state: 'suspended')
      │
      ▼
  AudioProvider polls isUnlocked every 500ms
      │
      ▼
  User interacts (click, keypress)
      │
      ▼
  AudioContext.resume() → state: 'running'
      │
      ▼
  isUnlocked = true → BGM and SFX now play
```

The `unlock()` method on `AudioProvider` explicitly calls `ctx.resume()`. Components can check `isUnlocked` to show unlock prompts if needed. The 500ms polling interval detects when the browser auto-unlocks the context after any user interaction on the page.

## Volume Controls

### UI Layout

`components/battlefield/audio-controls.tsx` — popover UI accessible from the battle header.

```
  ┌──────────────────────────────────┐
  │  [🔊] ◀── trigger button        │
  └──────────────────────────────────┘
          │
          ▼
  ┌──────────────────────────────────┐
  │  [🔇 Mute]        toggle button │
  │  ─────────────────────────────── │
  │  🔊 Master    ████████░░  75%   │
  │  ♫  Music     █████░░░░░  50%   │
  │  ⚡ Effects   ████████░░  80%   │
  └──────────────────────────────────┘
```

- Trigger button shows `Volume2` icon (unmuted) or `VolumeX` icon (muted)
- Each slider operates on 0–100 range, mapped to 0.0–1.0 internally
- Icons from `lucide-react` (`Volume2`, `VolumeX`, `Music`, `Zap`)
- UI primitives from `@pokehub/frontend/shared-ui-components` (Popover, Button, Slider)

### Persistence

Volume preferences are stored in `localStorage` under the key `POKEHUB_AUDIO_PREFS`:

```typescript
interface AudioPrefs {
  masterVolume: number;  // default 0.7
  bgmVolume: number;     // default 0.5
  sfxVolume: number;     // default 0.8
  muted: boolean;        // default false
}
```

Preferences are loaded on construction and persisted on every volume/mute change.

## Animation Integration

Audio playback is tightly integrated with the animation system. The `BattleAudioManager` instance is passed as an optional parameter to `playAnimationEvent()` in `state-anims.ts`.

### Move SFX Sequencing

Move sound effects play concurrently with the move's visual animation:

```
  playMove(scene, event, audio)
      │
      ├──▶ audio.playSfx(getMoveSfxUrl(moveName))  ─┐  (skipped when event.skipSfx)
      │                                               ├── Promise.all
      └──▶ moveAnimation(scene, attacker, defender)  ─┘
      │
      ▼
  250ms pause (post-move breath before hit sound)
```

`playSfx()` resolves when the audio buffer finishes playing (`onended` event). If the SFX file doesn't exist (404), the promise resolves silently without blocking the animation.

When the move doesn't connect, the launch SFX is suppressed — see [Move Failure Tracking](#move-failure-tracking).

### Effectiveness Tracking

`process-pending-events.ts` tracks whether a super-effective or resisted SFX has already played before a damage event to prevent double hit sounds:

```
  Protocol sequence:
    |-supereffective|...     → plays STATE_SFX.supereffective
    |-damage|p2a: X|120/270  → skipHitSfx = true (no normal hit sound)

  Without tracking:
    Super effective SFX plays     ← ✓
    Normal hit SFX also plays     ← ✗ double sound

  With tracking:
    Super effective SFX plays     ← ✓
    Damage event has skipHitSfx   ← no hit sound, just flinch animation
```

The `effectivenessPlayed` boolean resets on each new `move` event, ensuring only the immediately following damage event is affected.

### Move Failure Tracking

The same `process-pending-events.ts` peek-ahead also catches the inverse case: a move that doesn't connect. Four protocol events all signal "the move didn't land":

| Protocol command | Meaning                                                  |
|------------------|----------------------------------------------------------|
| `-miss`          | Accuracy roll failed                                     |
| `-fail`          | Move failed by its own mechanics (e.g. Substitute up)    |
| `-immune`        | Type or ability immunity                                 |
| `-notarget`      | No valid target (Gen 1–4 only; Gen 9+ uses `-fail`)      |

`extractAnimationEvent` collapses all four into a single `{ type: 'move-failed' }` animation event, so there is one handler instead of four.

```
  Protocol sequence:
    |move|p1a: X|Tackle|p2a: Y  → next event peeked
    |-miss|...                  → move event gets skipSfx = true
                                  playMove skips audio.playSfx(getMoveSfxUrl)
                                  visual animation still plays
                                  move-failed handler runs a 100ms beat
```

The original protocol args still flow into the log formatter, so the in-game log keeps the distinct text from each event ("missed!", "But it failed!", "It doesn't affect …").

`|cant|` (paralysis, sleep, flinch) is a separate case: it *replaces* the `|move|` event entirely, so `playMove` never runs — nothing to suppress.

### State Animation SFX

Each state animation handler plays its corresponding SFX:

| Animation | SFX | Notes |
|-----------|-----|-------|
| `playMove` | `getMoveSfxUrl(moveName)` | Concurrent with visual animation; skipped when `event.skipSfx` is set (a `move-failed` event follows) |
| `playDamage` | `STATE_SFX.damage` | Skipped when `event.skipHitSfx` is set |
| `playFaint` | `STATE_SFX.faint` | Plays before drop animation |
| `playSwitchIn` | `STATE_SFX.switchIn` + `getCryUrl(cryId)` | Pokeball sound + species cry |
| `playSwitchOut` | `STATE_SFX.switchOut` | Pokeball sound |
| `playBoost` | `STATE_SFX.boost` | Stat up chime |
| `playUnboost` | `STATE_SFX.unboost` | Stat down tone |
| `playStatus` | `STATE_SFX.status` | Status infliction sound |
| `playSuperEffective` | `STATE_SFX.supereffective` | Heavy hit + screen shake |
| `playResisted` | `STATE_SFX.resisted` | Weak hit sound |
| `playCrit` | — | No sound (screen shake + gold flash only) |
| `move-failed` handler | — | No sound or visual (100ms delay only). Also sets `skipSfx` on the preceding move event so its launch SFX is suppressed |

## Asset Upload Tool

### Usage

`tools/upload-audio-assets.ts` — one-time script to upload move SFX and state SFX files to Azure Blob Storage.

```bash
# Requires Azure CLI login
az login
npx tsx tools/upload-audio-assets.ts
```

Uses `DefaultAzureCredential` (ambient `az login` credentials) and creates the `audio` container with public blob read access.

### Move SFX Resolution

The script scans local directories in generation priority order (highest gen first):

```
GEN 7 SFX → GEN 6 SFX → GEN 5 SFX → GEN 4 SFX → GEN 3 SFX
```

For each `.mp3` file found:
1. Skip variant files (multi-hit, parts: `/part \d/`, `/\dhit/`, `/\dhits/`, `hit `)
2. Normalize filename (same algorithm as `getMoveSfxUrl`: camelCase→hyphen, lowercase, strip non-alphanumeric)
3. First match wins — GEN 7 sounds take priority over older gens

Uploads to: `moves/{normalizedName}.mp3`

### Special SFX Files

| Local Filename | Blob Path |
|----------------|-----------|
| `hit-super-effective.mp3` | `sfx/hit-super-effective.mp3` |
| `hit-weak-not-very-effective.mp3` | `sfx/hit-weak-not-very-effective.mp3` |
| `In-Battle_Faint_No_Health.mp3` | `sfx/faint.mp3` |
| `low-hp-pokemon.mp3` | `sfx/low-hp-pokemon.mp3` |
| `stats_up.wav` | `sfx/stat-up.wav` |
| `stats_down.wav` | `sfx/stat-down.wav` |

## Related Documentation

- [Battle Animation System](./battle-animation-system.md) — animation architecture, move registry, state transition animations
- [Battle Frontend Architecture](./battle-frontend-architecture.md) — state management, protocol pipeline, component structure
- [Battle System (Backend)](./battle-system.md) — server architecture, Redis model, matchmaking flows
