import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';
import React from 'react';

describe('Button', () => {
  it('should render children correctly', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole('button', { name: /Click Me/i });
    expect(button).toBeInTheDocument();
  });

  it('should handle onClick events', async () => {
    const user = userEvent.setup();
    const onClickMock = jest.fn();
    render(<Button onClick={onClickMock}>Click Me</Button>);

    const button = screen.getByRole('button', { name: /Click Me/i });
    await user.click(button);

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('should apply variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button', { name: /Delete/i });
    // Check for a class specific to the destructive variant
    expect(button).toHaveClass('bg-destructive');
  });

  it('should render as a child element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/link">Link</a>
      </Button>
    );

    // The role is now 'link' instead of 'button'
    const link = screen.getByRole('link', { name: /Link/i });
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');

    // It should not render a button element
    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });
});
