import type {
  AppRouter,
  PrivilegedAuthRoute,
  PublicRoute,
  ServerRouteGuardProps,
} from './models/router';
import '@pokehub/frontend/global-next-types';
import type { UserCore } from '@pokehub/shared/shared-user-models';
import type { Session } from 'next-auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

let routerInfo: AppRouter;
let getSessionCallback: () => Promise<Session | null>;

export const initServerRouteGuard = (props: ServerRouteGuardProps) => {
  if (!routerInfo && !getSessionCallback) {
    routerInfo = props.router;
    getSessionCallback = props.getSessionCallback;
  }
};

export const handleServerAuth = async () => {
  if (!routerInfo || !getSessionCallback) {
    return;
  }

  const session = await getSessionCallback();

  const currentRoute = headers().get('x-path') || '/';
  console.log(
    `${
      handleServerAuth.name
    } - Starting to Handle Server Authentication for ${currentRoute} ${
      session?.user ? JSON.stringify(session.user) : ''
    }`
  );

  const publicRouteInfo = routerInfo.publicRoutes.find(
    (route) =>
      (route.route === '/' && currentRoute === '/') ||
      (route.route !== '/' && currentRoute.startsWith(route.route))
  );
  const privateRouteInfo = routerInfo.privilegedRoutes.find((route) =>
    currentRoute.startsWith(route.route)
  );

  if (!session?.user) {
    if (publicRouteInfo) {
      console.log(
        `${handleServerAuth.name} - Route ${currentRoute} is public and authRes is undefined. Proceeding to show route`
      );
      return;
    }
    redirect(`/login`);
  }

  if (publicRouteInfo && !session.user) {
    console.log(
      `${handleServerAuth.name} - Route ${currentRoute} is public and authRes status is not 200. Proceeding to show route`
    );
    return;
  } else if (publicRouteInfo && session.user) {
    console.log(
      `${handleServerAuth.name} - Route ${currentRoute} is public and authRes status is 200. Checking if Route is Auth Accessible`
    );
    handlePublicRoute(publicRouteInfo, routerInfo, session.user);
  } else if (!session) {
    console.log(
      `${handleServerAuth.name} - Route ${currentRoute} is private and authRes status is not 200. Redirecting to /login`
    );
    redirect('/login');
  } else if (privateRouteInfo) {
    console.log(
      `${handleServerAuth.name} - Route ${currentRoute} is private and authRes status is 200. Checking if Route is User Role has permissions`
    );
    handlePrivateRouteInfo(privateRouteInfo, routerInfo, session.user);
  }

  return session;
};

const handlePublicRoute = (
  publicRoute: PublicRoute,
  routerInfo: AppRouter,
  userData: UserCore
) => {
  if (!publicRoute.isAuthAccessible) {
    console.log(
      `${handlePublicRoute.name} - Route ${publicRoute.route} is not auth accessible. Redirecting to ${userData.accountRole}'s redirectOnLogin config`
    );
    redirect(routerInfo.redirectOnLogin[userData.accountRole]);
  }
  console.log(
    `${handlePublicRoute.name} - Route ${publicRoute.route} is auth accessible. Proceeding to show route`
  );
};

const handlePrivateRouteInfo = (
  privateRouteInfo: PrivilegedAuthRoute,
  routerInfo: AppRouter,
  user: UserCore
) => {
  if (
    privateRouteInfo.rolesAllowed &&
    !privateRouteInfo.rolesAllowed.includes(user.accountRole)
  ) {
    console.log(
      `${handlePrivateRouteInfo.name} - Route ${
        privateRouteInfo.route
      } is not accessible by ${user.accountRole}. Redirecting to ${
        routerInfo.redirectOnLogin[user.accountRole]
      }}`
    );
    redirect(routerInfo.redirectOnLogin[user.accountRole]);
  } else if (
    privateRouteInfo.route === routerInfo.createUsernameRoute &&
    !!user.username
  ) {
    console.log(
      `${handlePrivateRouteInfo.name} - Route ${
        privateRouteInfo.route
      } is not accessible username ${!!user.username} is already created. Redirecting to ${
        routerInfo.redirectOnLogin[user.accountRole]
      }}`
    );
    redirect(routerInfo.redirectOnLogin[user.accountRole]);
  }
  console.log(
    `${handlePrivateRouteInfo.name} - Route ${privateRouteInfo.route} is accessible by ${user.accountRole}. Proceeding to show route`
  );
};
