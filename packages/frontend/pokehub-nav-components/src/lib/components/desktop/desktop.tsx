import { ThemeToggle } from '../theme-toggle';
import { UserDropdown } from './user-dropdown';
import { Button } from '@pokehub/frontend/shared-ui-components';
import type { UserCore } from '@pokehub/shared/shared-user-models';
import { BookOpen, MessageCircle, Swords, Wrench } from 'lucide-react';
import Link from 'next/link';

export interface DesktopNavProps {
  user?: UserCore;
  activePath: string;
  activeBattleId?: string;
}

export const DesktopNavItems = ({ user, activePath, activeBattleId }: DesktopNavProps) => {
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
            <BookOpen className="mr-2 h-4 w-4" />
            Pokedex
          </Button>
        </Link>
        {user ? (
          <>
            <Link href={activeBattleId ? `/battle/${activeBattleId}` : '/battle'}>
              <Button
                variant="ghost"
                className={`relative disabled:hover:none rounded-full text-sm font-medium text-foreground hover:bg-muted disabled:pointer-events-none disabled:bg-muted`}
                disabled={activePath === '/battle'}
              >
                <Swords className="mr-2 h-4 w-4" />
                Battle
                {activeBattleId && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/team-builder">
              <Button
                variant="ghost"
                className={`disabled:hover:none rounded-full text-sm font-medium text-foreground hover:bg-muted disabled:pointer-events-none disabled:bg-muted`}
                disabled={activePath === '/team-builder'}
              >
                <Wrench className="mr-2 h-4 w-4" />
                Team Builder
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
          {user && (
            <>
              <UserDropdown user={user} />
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
