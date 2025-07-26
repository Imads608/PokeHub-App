import { NextResponse, type NextRequest } from 'next/server';

// export { auth as middleware } from '@pokehub/frontend/shared-auth/server';
//
// export const config = {
//   matcher: ['/((?!api|_next/static|_next/image|image|favicon.ico).*)'],
// };

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-path', request.nextUrl.pathname);

  console.log(`Middleware: ${request.nextUrl.pathname}`);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
