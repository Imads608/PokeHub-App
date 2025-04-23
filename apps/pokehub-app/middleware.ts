import { NextResponse, type NextRequest } from 'next/server';

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
