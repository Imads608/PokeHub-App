'use client';

import { Button } from '@pokehub/frontend/shared-ui-components';
import { toast } from 'sonner';

export const DashComponent = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Button onClick={() => toast.success('Button clicked!')}>Click me</Button>
    </div>
  );
};
