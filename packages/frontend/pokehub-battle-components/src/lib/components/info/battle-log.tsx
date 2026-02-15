'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ScrollArea,
} from '@pokehub/frontend/shared-ui-components';
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
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Battle Log</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64 px-4 pb-4">
          <div className="space-y-0.5">
            {entries.map((line, index) => (
              <p
                key={index}
                className="text-xs text-muted-foreground whitespace-pre-wrap"
              >
                {line}
              </p>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
