import { Button } from '@pokehub/frontend/shared-ui-components';
import { ChevronLeft, Settings, User, Users } from 'lucide-react';
import Link from 'next/link';

export interface UserMenuProps {
  showProfileMenu: boolean;
  setShowProfileMenu: (show: boolean) => void;
}

export const UserMenu = ({
  showProfileMenu,
  setShowProfileMenu,
}: UserMenuProps) => {
  return (
    <div
      className={`absolute left-0 top-0 h-full w-full bg-background p-4 transition-transform duration-300 ease-in-out ${
        showProfileMenu ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="grid gap-2">
        <Button
          variant="ghost"
          className="w-full justify-start rounded-lg text-foreground hover:bg-muted"
          onClick={() => setShowProfileMenu(false)}
        >
          <ChevronLeft className="mr-3 h-4 w-4" />
        </Button>
        <Link href="/profile">
          <Button
            variant="ghost"
            className="w-full justify-start rounded-lg text-foreground hover:bg-muted"
          >
            <User className="mr-3 h-4 w-4" />
            View Profile
          </Button>
        </Link>
        <Link href="/edit-profile">
          <Button
            variant="ghost"
            className="w-full justify-start rounded-lg text-foreground hover:bg-muted"
          >
            <User className="mr-3 h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
        <Link href="/my-teams">
          <Button
            variant="ghost"
            className="w-full justify-start rounded-lg text-foreground hover:bg-muted"
          >
            <Users className="mr-3 h-4 w-4" />
            My Teams
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
      </div>
    </div>
  );
};
