import { UserMenu } from './user-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
} from '@pokehub/frontend/shared-ui-components';
import type { UserCore } from '@pokehub/shared/shared-user-models';
import { LogOut, LogIn, Swords, BookOpen, Wrench, MessageCircle } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export const MobileMenuItems = ({ user, activeBattleId }: { user?: UserCore; activeBattleId?: string }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <div className="glass mx-4 mt-2 overflow-hidden rounded-xl p-4 md:hidden" data-testid="mobile-menu">
      <div
        className={`grid flex-col gap-2 transition-transform duration-300 ease-in-out ${
          showProfileMenu ? '-translate-x-full' : ''
        }`}
      >
        <Link href="/pokedex">
          <Button
            variant="ghost"
            className="w-full justify-start rounded-lg text-foreground hover:bg-muted"
          >
            <BookOpen className="mr-2 h-5 w-5" />
            Pokedex
          </Button>
        </Link>

        {user ? (
          <>
            <Link href={activeBattleId ? `/battle/${activeBattleId}` : '/battle'}>
              <Button
                variant="ghost"
                className="relative w-full justify-start rounded-lg text-foreground hover:bg-muted"
              >
                <Swords className="mr-2 h-5 w-5" />
                Battle
                {activeBattleId && (
                  <span className="ml-2 flex h-2 w-2">
                    <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/team-builder">
              <Button
                variant="ghost"
                className="w-full justify-start rounded-lg text-foreground hover:bg-muted"
              >
                <Wrench className="mr-2 h-5 w-5" />
                Team Builder
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg  hover:bg-muted"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex justify-start rounded-lg text-foreground hover:bg-muted"
              onClick={() => setShowProfileMenu(true)}
            >
              <Avatar className="mr-2 h-8 w-8">
                <AvatarImage
                  src={user.avatarUrl || ''}
                  alt={user.username || 'User'}
                />
                <AvatarFallback className="bg-primary text-sm font-medium text-primary-foreground">
                  {user.username?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              Profile
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg text-destructive hover:bg-destructive/10"
              onClick={() => signOut({ redirectTo: '/login' })}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Log out
            </Button>
          </>
        ) : (
          <Link href="/login">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg  hover:bg-destructive/10"
              onClick={() => signOut({ redirectTo: '/login' })}
            >
              <LogIn className="mr-2 h-5 w-5" />
              Log In
            </Button>
          </Link>
        )}
      </div>

      <UserMenu
        setShowProfileMenu={setShowProfileMenu}
        showProfileMenu={showProfileMenu}
      />
    </div>
  );
};
