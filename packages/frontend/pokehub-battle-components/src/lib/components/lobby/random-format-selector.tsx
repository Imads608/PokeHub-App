'use client';

import {
  getRandomFormats,
  getShowdownFormatId,
} from '@pokehub/frontend/dex-data-provider';
import { Badge } from '@pokehub/frontend/shared-ui-components';
import type { GenerationNum } from '@pkmn/dex';
import { CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';

interface RandomFormatSelectorProps {
  selectedFormat: string;
  onFormatSelect: (showdownFormatId: string) => void;
}

interface FormatGroup {
  generation: GenerationNum;
  formats: { id: string; name: string; showdownId: string }[];
}

export function RandomFormatSelector({
  selectedFormat,
  onFormatSelect,
}: RandomFormatSelectorProps) {
  const groups = useMemo(() => {
    const formats = getRandomFormats();
    const map = new Map<number, FormatGroup>();

    for (const format of formats) {
      if (!map.has(format.generation)) {
        map.set(format.generation, {
          generation: format.generation,
          formats: [],
        });
      }
      map.get(format.generation)!.formats.push({
        id: format.id,
        name: format.name,
        showdownId: getShowdownFormatId(format.generation, format.id),
      });
    }

    return Array.from(map.values());
  }, []);

  return (
    <div className="max-h-[400px] overflow-y-auto">
      <div className="space-y-4 pr-1">
        {groups.map((group) => (
          <div key={group.generation}>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Gen {group.generation}
              </p>
              <Badge variant="outline" className="text-xs">
                {group.formats.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {group.formats.map((format) => {
                const isSelected = format.showdownId === selectedFormat;
                return (
                  <button
                    key={format.showdownId}
                    type="button"
                    onClick={() => onFormatSelect(format.showdownId)}
                    className={`w-full text-left transition-all rounded-lg border p-3 ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                    } cursor-pointer`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{format.name}</span>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
