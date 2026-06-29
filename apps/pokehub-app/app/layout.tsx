import { AppBootstrapper } from './(components)/bootstrapper';
import './global.css';
import type { Metadata } from 'next';

//import { createFetchClient } from '@pokehub/frontend/shared-data-provider';

export const metadata: Metadata = {
  title: 'PokeHub',
  description: 'A modern version of Pokemon Showdown',
  icons: {
    icon: '/favicon.svg',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppBootstrapper>{children}</AppBootstrapper>
      </body>
    </html>
  );
}
