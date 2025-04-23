import { ThemeToggle } from './theme-toggle';
import { Button } from '@pokehub/frontend/shared-ui-components';
import { MessageCircle, Swords, Settings, LogOutIcon } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

export interface DesktopNavProps {
  isAuthenticated: boolean;
  activePath: string;
}

export const DesktopNavItems = ({
  isAuthenticated,
  activePath,
}: DesktopNavProps) => {
  return (
    <>
      <div className="hidden items-center gap-1 md:flex">
        <Link href="/pokedex">
          <Button
            variant="ghost"
            className={`rounded-full text-sm font-medium text-foreground hover:bg-muted ${
              activePath === '/pokedex' ? 'bg-muted' : ''
            }`}
            disabled={activePath === '/pokedex'}
          >
            Pokedex
          </Button>
        </Link>
        {isAuthenticated ? (
          <>
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className={`disabled:hover:none rounded-full text-sm font-medium text-foreground hover:bg-muted disabled:pointer-events-none disabled:bg-muted`}
                disabled={activePath === '/dashboard'}
              >
                Dashboard
              </Button>
            </Link>
            <Link href="/battle">
              <Button
                variant="ghost"
                className={`disabled:hover:none rounded-full text-sm font-medium text-foreground hover:bg-muted disabled:pointer-events-none disabled:bg-muted`}
                disabled={activePath === '/battle'}
              >
                <Swords className="mr-2 h-4 w-4" />
                Battle
              </Button>
            </Link>
          </>
        ) : (
          <Link href="/login">
            <Button
              variant="ghost"
              className={`disabled:hover:none rounded-full text-sm font-medium text-foreground hover:bg-muted disabled:pointer-events-none disabled:bg-muted`}
              disabled={activePath === '/login'}
            >
              Sign In
            </Button>
          </Link>
        )}
      </div>
      <div className="hidden items-center gap-1 md:flex">
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {isAuthenticated && (
            <>
              <Link href="/settings">
                <Button
                  variant="ghost"
                  className={`disabled:hover:none rounded-full text-sm font-medium text-foreground hover:bg-muted disabled:pointer-events-none disabled:bg-muted`}
                  disabled={activePath === '/settings'}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
              <Button
                variant="ghost"
                className={`rounded-full text-sm font-bold text-destructive hover:bg-destructive/10 `}
                onClick={() => signOut({ redirectTo: '/login' })}
              >
                <LogOutIcon className="mr-2 h-4 w-4" />
                Logout
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-foreground hover:bg-muted"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
};
