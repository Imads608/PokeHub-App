'use client';

import { ScrollArea } from '@pokehub/frontend/shared-ui-components';
import { ScrollText } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface BattleLogProps {
  entries: string[];
}

export function BattleLog({ entries }: BattleLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden h-full">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
        <ScrollText className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
          Battle Log
        </span>
      </div>
      <ScrollArea className="h-72 px-4 py-3">
        <div className="space-y-0.5">
          {entries.length === 0 && (
            <p className="text-xs text-muted-foreground/50 italic text-center py-4">
              Battle events will appear here...
            </p>
          )}
          {entries.map((html, index) => (
            <div
              key={index}
              className="text-xs text-muted-foreground leading-relaxed [&_strong]:font-bold [&_strong]:text-foreground [&_small]:text-muted-foreground/70 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-2 [&_h2]:mb-1 [&_abbr]:no-underline [&_abbr]:cursor-help"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
