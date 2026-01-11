import { requestContext } from '@pokehub/frontend/shared-logger/server';
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  // Set the x-path header to the current request path (needed for server side auth in handleServerAuth)
  requestHeaders.set('x-path', request.nextUrl.pathname);

  const traceId = request.headers.get('x-trace-id') || crypto.randomUUID();
  requestHeaders.set('x-trace-id', traceId);

  return requestContext.run({ traceId }, () => {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.headers.set('x-trace-id', traceId);
    return response;
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public folder assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
};
