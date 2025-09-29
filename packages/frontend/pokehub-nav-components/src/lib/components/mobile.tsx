import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
} from '@pokehub/frontend/shared-ui-components';
import type { UserCore } from '@pokehub/shared/shared-user-models';
import {
  LogOut,
  MessageCircle,
  Swords,
  User,
  Shield,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

export const MobileMenuItems = ({ user }: { user?: UserCore }) => {
  return (
    <div className="glass mx-4 mt-2 rounded-xl p-4 md:hidden">
      <div className="grid gap-2">
        <Button
          variant="ghost"
          className="w-full justify-start rounded-lg text-foreground hover:bg-muted"
          onClick={() => {
            /* Handle battle navigation */
          }}
        >
          <Swords className="mr-2 h-5 w-5" />
          Battle
        </Button>

        {user ? (
          <>
            <Link href="/team-builder">
              <Button
                variant="ghost"
                className="w-full justify-start rounded-lg text-foreground hover:bg-muted"
              >
                <Shield className="mr-2 h-5 w-5" />
                Team Builder
              </Button>
            </Link>
            <Link href="/settings">
              <Button
                variant="ghost"
                className="w-full justify-start rounded-lg text-foreground hover:bg-muted"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Link href="/profile">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-foreground hover:bg-muted"
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
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg text-destructive hover:bg-destructive/10"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Log out
            </Button>
          </>
        ) : (
          <Link href="/login">
            <Button variant="default" className="mt-2 w-full justify-center">
              Sign In
            </Button>
          </Link>
        )}

        <div className="mt-4 flex justify-between gap-2">
          {!user ? (
            <Button
              variant="outline"
              size="icon"
              className="flex-1 rounded-lg"
              asChild
            >
              <Link href="/login">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="flex-1 rounded-lg"
              // onClick={() => setIsChatOpen(true)}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
