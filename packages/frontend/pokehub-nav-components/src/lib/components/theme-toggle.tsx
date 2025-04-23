import { useTheme } from '@pokehub/frontend/shared-theme-context';
import { Button } from '@pokehub/frontend/shared-ui-components';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle = ({ className }: { className?: string }) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`rounded-full text-foreground hover:bg-muted ${className}`}
      onClick={() => toggleTheme()}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
};
