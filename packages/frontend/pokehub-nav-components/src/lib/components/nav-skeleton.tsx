import { LogoIcon } from '@pokehub/frontend/shared-ui-icons';
import Link from 'next/link';

export const NavSkeleton = () => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 py-4 backdrop-blur-sm transition-all duration-300" data-testid="nav-skeleton">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-10  rounded-full shadow-md">
            <LogoIcon assetPath={'./images/logo.svg'} />
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-primary">Poké</span>
            <span className="text-foreground">Hub</span>
          </span>
        </Link>
        <div className="ml-8 hidden w-full items-center justify-between md:flex">
          <div className="h-8 w-24 animate-pulse rounded-md bg-gray-300"></div>
          <div className="h-8 w-24 animate-pulse rounded-md bg-gray-300"></div>
          <div className="h-8 w-24 animate-pulse rounded-md bg-gray-300"></div>
        </div>
        <div className="flex items-center md:hidden">
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-300"></div>
        </div>
      </div>
    </nav>
  );
};
