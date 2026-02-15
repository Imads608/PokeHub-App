'use client';

import { Button } from '@pokehub/frontend/shared-ui-components';
import { Loader2, X } from 'lucide-react';

interface QueueStatusProps {
  onCancel: () => void;
  disabled?: boolean;
}

export function QueueStatus({ onCancel, disabled }: QueueStatusProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="text-center">
        <p className="text-lg font-medium">Searching for opponent...</p>
        <p className="text-sm text-muted-foreground mt-1">
          This may take a moment
        </p>
      </div>
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={disabled}
        className="mt-2"
      >
        <X className="mr-2 h-4 w-4" />
        Cancel
      </Button>
    </div>
  );
}
