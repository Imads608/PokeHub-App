'use client';

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Slider,
} from '@pokehub/frontend/shared-ui-components';
import { Volume2, VolumeX, Music, Zap } from 'lucide-react';
import { useAudio } from '../../audio/audio.context';

export function AudioControls() {
  const {
    isMuted,
    masterVolume,
    bgmVolume,
    sfxVolume,
    setMasterVolume,
    setBgmVolume,
    setSfxVolume,
    toggleMute,
  } = useAudio();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            // Single click toggles mute, popover opens on the button itself
            if (e.detail === 2) return; // ignore double-click
          }}
        >
          {isMuted ? (
            <VolumeX className="h-3.5 w-3.5" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 space-y-3 p-3" align="end">
        {/* Mute toggle */}
        <button
          className="flex w-full items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={toggleMute}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          <span>{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        <div className="h-px bg-border" />

        {/* Master volume */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Volume2 className="h-3 w-3" />
            <span>Master</span>
            <span className="ml-auto tabular-nums">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
          <Slider
            value={[masterVolume * 100]}
            max={100}
            step={1}
            onValueChange={([v]) => setMasterVolume(v / 100)}
          />
        </div>

        {/* BGM volume */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Music className="h-3 w-3" />
            <span>Music</span>
            <span className="ml-auto tabular-nums">
              {Math.round(bgmVolume * 100)}%
            </span>
          </div>
          <Slider
            value={[bgmVolume * 100]}
            max={100}
            step={1}
            onValueChange={([v]) => setBgmVolume(v / 100)}
          />
        </div>

        {/* SFX volume */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>Effects</span>
            <span className="ml-auto tabular-nums">
              {Math.round(sfxVolume * 100)}%
            </span>
          </div>
          <Slider
            value={[sfxVolume * 100]}
            max={100}
            step={1}
            onValueChange={([v]) => setSfxVolume(v / 100)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
