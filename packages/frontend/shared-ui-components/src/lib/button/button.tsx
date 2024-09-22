import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import classNames from 'classnames';
import * as React from 'react';

import { UIColor } from '../models/colors';
import { cn } from '../utils';

// Reference to get Tailwind CSS Intellisense working: https://cva.style/docs/getting-started/installation
const buttonVariants = cva(
  'inline-flex items-center text-white leading-6 justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-3 py-2',
  {
    variants: {
      variant: {
        default: 'shadow',
        outline:
          'text-grey-text border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-4',
        link: 'underline-offset-4 hover:underline',
      },
      size: {
        full: 'w-full',
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  color?: UIColor;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, color, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(
          buttonVariants({
            variant,
            size,
            className: classNames(
              `${className}`,
              {
                'bg-secondary hover:bg-primary/90': (!color || color === 'primary') && variant === 'default',
                'bg-secondary hover:bg-secondary/90': color === 'secondary' && variant === 'default',
                'bg-red-main hover:bg-red-main/90': color === 'red-main' && variant === 'default',
                'bg-blue-main hover:bg-blue-main/90': color === 'blue-main' && variant === 'default',
                'bg-indigo-main hover:bg-indigo-main/90': color === 'indigo-main' && variant === 'default',
                'bg-indigo-main-bold hover:bg-indigo-main/90': color === 'indigo-main-bold' && variant === 'default',
                'bg-gray-main hover:bg-gray-main/90': color === 'gray-main' && variant === 'default',
                'bg-grey-text hover:bg-grey-text/90': color === 'grey-text' && variant === 'default',
                'bg-gray-disabled hover:bg-gray-disabled/90': color === 'gray-disabled' && variant === 'default',
                'bg-gray-border hover:bg-gray-border/90': color === 'gray-border' && variant === 'default',
              },
              {
                'border-primary': (!color || color === 'primary') && variant === 'outline',
                'border-secondary': color === 'secondary' && variant === 'outline',
                'border-red-main': color === 'red-main' && variant === 'outline',
                'border-blue-main': color === 'blue-main' && variant === 'outline',
                'border-indigo-main': color === 'indigo-main' && variant === 'outline',
                'border-indigo-main-bold': color === 'indigo-main-bold' && variant === 'outline',
                'border-gray-main': color === 'gray-main' && variant === 'outline',
                'border-grey-text': color === 'grey-text' && variant === 'outline',
                'border-gray-disabled': color === 'gray-disabled' && variant === 'outline',
                'border-gray-border': color === 'gray-border' && variant === 'outline',
              },
              {
                'text-primary': (!color || color === 'primary') && variant === 'link',
                'text-secondary': color === 'secondary' && variant === 'link',
                'text-red-main': color === 'red-main' && variant === 'link',
                'text-blue-main': color === 'blue-main' && variant === 'link',
                'text-indigo-main': color === 'indigo-main' && variant === 'link',
                'text-indigo-main-bold': color === 'indigo-main-bold' && variant === 'link',
                'text-gray-main': color === 'gray-main' && variant === 'link',
                'text-grey-text': color === 'grey-text' && variant === 'link',
                'text-gray-disabled': color === 'gray-disabled' && variant === 'link',
                'text-gray-border': color === 'gray-border' && variant === 'link',
              }
            ),
          })
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

/**
 * 
 * const buttonVariants = cva(
  'inline-flex items-center text-white leading-6 justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-3 py-2',
  {
    variants: {
      variant: {
        indigo: 'bg-indigo-main-bold shadow-sm hover:bg-indigo-main',
        default: 'bg-secondary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-red-main bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        full: 'w-full',
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
 */
