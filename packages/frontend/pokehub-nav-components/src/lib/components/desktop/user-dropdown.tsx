'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@pokehub/frontend/shared-ui-components';
import type { UserCore } from '@pokehub/shared/shared-user-models';
import { LogOutIcon, Settings, User, Users } from 'lucide-react';
import { signOut } from 'next-auth/react';

export interface UserDropdownProps {
  user: UserCore;
}

export const UserDropdown = ({ user }: UserDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full p-1 text-foreground hover:bg-muted"
        >
          <Avatar className="h-8 w-8" data-testid="nav-user-avatar">
            <AvatarImage
              src={user.avatarUrl || ''}
              alt={user.username || 'User'}
              data-testid="nav-user-avatar-image"
            />
            <AvatarFallback className="bg-primary text-sm font-medium text-primary-foreground">
              {user.username?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[100] w-64" sideOffset={8}>
        <div className="flex items-center justify-start gap-3 p-3">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={user.avatarUrl || ''}
              alt={user.username || 'User'}
            />
            <AvatarFallback className="bg-primary text-lg font-medium text-primary-foreground">
              {user.username?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 leading-none">
            {user.username && (
              <p className="text-sm font-semibold">{user.username}</p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => (window.location.href = '/profile')}
          className="cursor-pointer py-2 font-medium"
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => (window.location.href = '/profile')}
          className="cursor-pointer py-2 font-medium"
        >
          <User className="mr-3 h-4 w-4" />
          View Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => (window.location.href = '/edit-profile')}
          className="cursor-pointer py-2 font-medium"
        >
          <User className="mr-3 h-4 w-4" />
          Edit Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => (window.location.href = '/my-teams')}
          className="cursor-pointer py-2 font-medium"
        >
          <Users className="mr-3 h-4 w-4" />
          My Teams
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ redirectTo: '/login' })}
          className={`cursor-pointer rounded-full py-2 text-sm font-bold text-destructive hover:bg-destructive/10 `}
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
