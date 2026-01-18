import { AppBootstrapper } from './(components)/bootstrapper';
import './global.css';

//import { createFetchClient } from '@pokehub/frontend/shared-data-provider';

export const metadata = {
  title: 'PokeHub',
  description: 'A modern Pokemon companion app for trainers',
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
