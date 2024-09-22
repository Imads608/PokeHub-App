import * as React from 'react';

import { cn } from '../utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'block w-full rounded-md border-0 py-1.5 text-grey-text shadow-sm ring-1 ring-inset ring-gray-border placeholder:text-gray-disabled focus:ring-2 focus:ring-inset focus:ring-indigo-main-bold sm:text-sm sm:leading-6',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
