import { Button } from '@pokehub/frontend/shared-ui-components';
import { LogOut, MessageCircle, Swords, User } from 'lucide-react';
import Link from 'next/link';

export const MobileMenuItems = ({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) => {
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

        {isAuthenticated ? (
          <div className="">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg text-foreground hover:bg-muted"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Chat
            </Button>

            <Link href="/profile">
              <Button
                variant="ghost"
                className="w-full justify-start rounded-lg text-foreground hover:bg-muted"
              >
                Profile
              </Button>
            </Link>
            <Link href="/settings">
              <Button
                variant="ghost"
                className="w-full justify-start rounded-lg text-foreground hover:bg-muted"
              >
                Settings
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg text-destructive hover:bg-destructive/10"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Log out
            </Button>
          </div>
        ) : (
          <Link href="/login">
            <Button variant="default" className="mt-2 w-full justify-center">
              Sign In
            </Button>
          </Link>
        )}

        <div className="mt-4 flex justify-between gap-2">
          {!isAuthenticated && (
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
          )}
          <Button
            variant="outline"
            size="icon"
            className="flex-1 rounded-lg"
            // onClick={() => setIsChatOpen(true)}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
