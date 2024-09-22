import { UserCoreWithAccessToken } from '@pokehub/shared/shared-user-models';
import { redirect } from 'next/navigation';

import { AppRouter, PrivilegedAuthRoute, PublicRoute } from './models/router';

export const handleServerAuth = async (
  authRes: UserCoreWithAccessToken | undefined,
  currentRoute: string,
  routerInfo: AppRouter
) => {
  console.log(`${handleServerAuth.name} - Starting to Handle Server Authentication for ${currentRoute}`);

  const publicRouteInfo = routerInfo.publicRoutes.find(
    (route) =>
      (route.route === '/' && currentRoute === '/') || (route.route !== '/' && currentRoute.startsWith(route.route))
  );
  const privateRouteInfo = routerInfo.privilegedRoutes.find((route) => currentRoute.startsWith(route.route));

  if (!authRes) {
    if (publicRouteInfo) {
      console.log(
        `${handleServerAuth.name} - Route ${currentRoute} is public and authRes is undefined. Proceeding to show route`
      );
      return;
    }
    redirect(`/login`);
  }

  if (publicRouteInfo && !authRes) {
    console.log(
      `${handleServerAuth.name} - Route ${currentRoute} is public and authRes status is not 200. Proceeding to show route`
    );
    return;
  } else if (publicRouteInfo) {
    console.log(
      `${handleServerAuth.name} - Route ${currentRoute} is public and authRes status is 200. Checking if Route is Auth Accessible`
    );
    handlePublicRoute(publicRouteInfo, routerInfo, authRes);
  } else if (!authRes) {
    console.log(
      `${handleServerAuth.name} - Route ${currentRoute} is private and authRes status is not 200. Redirecting to /login`
    );
    redirect('/login');
  } else if (privateRouteInfo) {
    console.log(
      `${handleServerAuth.name} - Route ${currentRoute} is private and authRes status is 200. Checking if Route is User Role has permissions`
    );
    handlePrivateRouteInfo(privateRouteInfo, routerInfo, authRes);
  }
};

const handlePublicRoute = (publicRoute: PublicRoute, routerInfo: AppRouter, userData: UserCoreWithAccessToken) => {
  if (!publicRoute.isAuthAccessible) {
    console.log(
      `${handlePublicRoute.name} - Route ${publicRoute.route} is not auth accessible. Redirecting to ${userData.user.accountRole}'s redirectOnLogin config`
    );
    redirect(routerInfo.redirectOnLogin[userData.user.accountRole]);
  }
  console.log(`${handlePublicRoute.name} - Route ${publicRoute.route} is auth accessible. Proceeding to show route`);
};

const handlePrivateRouteInfo = (
  privateRouteInfo: PrivilegedAuthRoute,
  routerInfo: AppRouter,
  userData: UserCoreWithAccessToken
) => {
  if (privateRouteInfo.rolesAllowed && !privateRouteInfo.rolesAllowed.includes(userData.user.accountRole)) {
    console.log(
      `${handlePrivateRouteInfo} - Route ${privateRouteInfo.route} is not accessible by ${
        userData.user.accountRole
      }. Redirecting to ${routerInfo.redirectOnLogin[userData.user.accountRole]}}`
    );
    redirect(routerInfo.redirectOnLogin[userData.user.accountRole]);
  }
  console.log(
    `${handlePrivateRouteInfo} - Route ${privateRouteInfo.route} is accessible by ${userData.user.accountRole}. Proceeding to show route`
  );
};
