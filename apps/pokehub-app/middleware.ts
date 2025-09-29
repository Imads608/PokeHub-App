import { requestContext } from '@pokehub/frontend/shared-logger/server';
import { NextResponse, type NextRequest } from 'next/server';

// export { auth as middleware } from '@pokehub/frontend/shared-auth/server';
//
// export const config = {
//   matcher: ['/((?!api|_next/static|_next/image|image|favicon.ico).*)'],
// };

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
