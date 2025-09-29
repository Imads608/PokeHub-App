'use client';

import { DesktopNavItems } from './components/desktop/desktop';
import { MobileMenuItems } from './components/mobile/mobile';
import { NavSkeleton } from './components/nav-skeleton';
import { ThemeToggle } from './components/theme-toggle';
import { Button } from '@pokehub/frontend/shared-ui-components';
import { LogoIcon } from '@pokehub/frontend/shared-ui-icons';
import { Menu, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export function AppNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();

  console.log('isChatOpen', isChatOpen);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (status === 'loading') {
    return <NavSkeleton />;
  }

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'glass py-2 shadow-lg'
          : 'bg-background/80 py-4 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-10  rounded-full shadow-md">
            <LogoIcon assetPath={'./images/logo.svg'} />
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-primary">Poké</span>
            <span className="text-foreground">Hub</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <DesktopNavItems user={session?.user} activePath={pathname} />

        {/* Mobile Menu Button */}
        <div className="flex items-center">
          <ThemeToggle className="md:hidden" />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-foreground hover:bg-muted md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && <MobileMenuItems user={session?.user} />}
    </nav>
  );
}
