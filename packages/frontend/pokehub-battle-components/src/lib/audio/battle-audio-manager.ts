const AUDIO_PREFS_KEY = 'POKEHUB_AUDIO_PREFS';

interface AudioPrefs {
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
  muted: boolean;
}

const DEFAULT_PREFS: AudioPrefs = {
  masterVolume: 0.7,
  bgmVolume: 0.5,
  sfxVolume: 0.8,
  muted: false,
};

/**
 * Web Audio API manager for battle BGM and SFX.
 *
 * Audio graph:
 *   BGM source --> bgmGain --> masterGain --> destination
 *   SFX source --> sfxGain --> masterGain --> destination
 *
 * Created once per battle via AudioProvider.
 * Handles autoplay policy (AudioContext starts suspended, resumed on user gesture).
 */
export class BattleAudioManager {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private bgmGain: GainNode;
  private sfxGain: GainNode;
  private bufferCache = new Map<string, AudioBuffer>();
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmUrl: string | null = null;
  private prefs: AudioPrefs;
  private disposed = false;

  constructor() {
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.bgmGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();

    this.bgmGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.prefs = this.loadPrefs();
    this.applyPrefs();
  }

  // ── Autoplay unlock ────────────────────────────────────────────────────

  async resume(): Promise<void> {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  get isUnlocked(): boolean {
    return this.ctx.state === 'running';
  }

  // ── BGM ────────────────────────────────────────────────────────────────

  async playBgm(url: string): Promise<void> {
    if (this.disposed) return;
    if (this.bgmUrl === url && this.bgmSource) return;

    this.stopBgmImmediate();

    try {
      const buffer = await this.fetchAndDecode(url);
      if (this.disposed) return;

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(this.bgmGain);
      source.start(0);

      this.bgmSource = source;
      this.bgmUrl = url;
    } catch {
      // Network failure or decode error — silently skip BGM
    }
  }

  stopBgm(fadeMs = 0): void {
    if (!this.bgmSource) return;

    if (fadeMs > 0) {
      const gain = this.bgmGain;
      gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(
        0,
        this.ctx.currentTime + fadeMs / 1000
      );

      const source = this.bgmSource;
      this.bgmSource = null;
      this.bgmUrl = null;

      setTimeout(() => {
        try {
          source.stop();
          source.disconnect();
        } catch {
          // Already stopped
        }
        // Restore gain for next BGM
        gain.gain.setValueAtTime(this.prefs.bgmVolume, this.ctx.currentTime);
      }, fadeMs);
    } else {
      this.stopBgmImmediate();
    }
  }

  private stopBgmImmediate(): void {
    if (this.bgmSource) {
      try {
        this.bgmSource.stop();
        this.bgmSource.disconnect();
      } catch {
        // Already stopped
      }
      this.bgmSource = null;
      this.bgmUrl = null;
    }
  }

  // ── SFX ────────────────────────────────────────────────────────────────

  /**
   * Play an SFX and resolve when playback finishes.
   * On error (network/decode), resolves immediately (silent skip).
   */
  async playSfx(url: string): Promise<void> {
    if (this.disposed || !url) return;

    try {
      const buffer = await this.fetchAndDecode(url);
      if (this.disposed) return;

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.sfxGain);
      source.start(0);

      await new Promise<void>((resolve) => {
        source.onended = () => {
          source.disconnect();
          resolve();
        };
      });
    } catch {
      // Network failure or decode error — silently skip SFX
    }
  }

  // ── Volume controls ────────────────────────────────────────────────────

  get masterVolume(): number {
    return this.prefs.masterVolume;
  }

  get bgmVolume(): number {
    return this.prefs.bgmVolume;
  }

  get sfxVolume(): number {
    return this.prefs.sfxVolume;
  }

  get muted(): boolean {
    return this.prefs.muted;
  }

  setMasterVolume(v: number): void {
    this.prefs.masterVolume = Math.max(0, Math.min(1, v));
    this.applyPrefs();
    this.persistPrefs();
  }

  setBgmVolume(v: number): void {
    this.prefs.bgmVolume = Math.max(0, Math.min(1, v));
    this.applyPrefs();
    this.persistPrefs();
  }

  setSfxVolume(v: number): void {
    this.prefs.sfxVolume = Math.max(0, Math.min(1, v));
    this.applyPrefs();
    this.persistPrefs();
  }

  setMuted(m: boolean): void {
    this.prefs.muted = m;
    this.applyPrefs();
    this.persistPrefs();
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  dispose(): void {
    this.disposed = true;
    this.stopBgmImmediate();
    this.bufferCache.clear();
    void this.ctx.close();
  }

  // ── Internal ───────────────────────────────────────────────────────────

  private async fetchAndDecode(url: string): Promise<AudioBuffer> {
    const cached = this.bufferCache.get(url);
    if (cached) return cached;

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.bufferCache.set(url, audioBuffer);
    return audioBuffer;
  }

  private applyPrefs(): void {
    const effective = this.prefs.muted ? 0 : this.prefs.masterVolume;
    this.masterGain.gain.setValueAtTime(effective, this.ctx.currentTime);
    this.bgmGain.gain.setValueAtTime(this.prefs.bgmVolume, this.ctx.currentTime);
    this.sfxGain.gain.setValueAtTime(this.prefs.sfxVolume, this.ctx.currentTime);
  }

  private loadPrefs(): AudioPrefs {
    try {
      const raw = localStorage.getItem(AUDIO_PREFS_KEY);
      if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    } catch {
      // Corrupted or unavailable localStorage
    }
    return { ...DEFAULT_PREFS };
  }

  private persistPrefs(): void {
    try {
      localStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify(this.prefs));
    } catch {
      // localStorage full or unavailable
    }
  }
}
