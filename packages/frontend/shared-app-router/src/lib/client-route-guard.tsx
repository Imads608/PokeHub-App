'use client';

import type {
  PrivilegedAuthRoute,
  PublicRoute,
  RedirectRoute,
  RouteGuardProps,
} from './models/router';
import { useAuthSession } from '@pokehub/frontend/shared-auth';
import type { UserAccountRole } from '@pokehub/shared/shared-user-models';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export const ClientRouteGuard = ({
  children,
  loginPath,
  publicPaths,
  redirectOnLogin,
  privilegedRoutes,
}: RouteGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const queryParams = useSearchParams();
  const { data: authData, status } = useAuthSession();
  const [authorized, setAuthorized] = useState<boolean>(() => {
    const routeType = checkActiveRouteType(
      pathname,
      publicPaths,
      privilegedRoutes || []
    );
    return (
      isPublicRoute(routeType) &&
      ((authData?.user && routeType.isAuthAccessible) || !authData?.user)
    );
  });

  /* Trigger on Authentication Change */
  useEffect(() => {
    authCheck(pathname);
  }, [authData?.user, status]);

  /* Trigger on Page Change */
  useEffect(() => {
    authCheck(pathname);
  }, [pathname, queryParams]);

  const redirectToDefaultPrivilegedPage = (accountRole: UserAccountRole) => {
    if (queryParams.get('from')) {
      const path = queryParams.get('from') as string;
      const routeType = checkActiveRouteType(
        path,
        publicPaths,
        privilegedRoutes || []
      );
      if (!(accountRole in redirectOnLogin)) {
        return;
      }

      if (
        isPublicRoute(routeType) ||
        (isPrivateRoute(routeType) &&
          isRoleAllowed(routeType.rolesAllowed, accountRole))
      ) {
        router.push(queryParams.get('from') as string);
      } else {
        router.push(getRedirectRoute(redirectOnLogin, accountRole));
      }
    } else {
      router.push(getRedirectRoute(redirectOnLogin, accountRole));
    }
  };

  const authCheck = (url: string) => {
    const path = url.split('?')[0];
    const routeType = checkActiveRouteType(
      path,
      publicPaths,
      privilegedRoutes || []
    );

    if (status === 'unauthenticated' && !isPublicRoute(routeType)) {
      setAuthorized(false);
      router.push(`${loginPath}?from=${path}`);
    } else if (status !== 'loading') {
      if (
        authData?.user &&
        isPrivateRoute(routeType) &&
        !isRoleAllowed(routeType.rolesAllowed, authData.user.accountRole)
      ) {
        router.push(
          getRedirectRoute(redirectOnLogin, authData.user.accountRole)
        );
      } else if (
        authData?.user &&
        isPrivateRoute(routeType) &&
        url === '/create-profile' &&
        authData.user.username
      ) {
        router.push(
          getRedirectRoute(redirectOnLogin, authData.user.accountRole)
        );
      } else if (
        authData?.user &&
        isPublicRoute(routeType) &&
        !routeType.isAuthAccessible
      ) {
        if (!authData.user.username) {
          router.push('/create-profile');
        } else {
          redirectToDefaultPrivilegedPage(authData.user.accountRole);
        }
      } else {
        setAuthorized(true);
      }
      // else if (authChange && !isAuthenticated.value && currAuthStatus) {
      //   onLogout?.();
      //   router.refresh();
      //   setAuthorized(true);
      // } else {
      //   setAuthorized(true);
      // }
    }
  };

  return authorized ? children : <div></div>;
};

const isPublicRoute = (
  route: PublicRoute | PrivilegedAuthRoute | undefined
): route is PublicRoute => {
  return !!route && !(route as PrivilegedAuthRoute).rolesAllowed;
};

const isPrivateRoute = (
  route: PublicRoute | PrivilegedAuthRoute | undefined
): route is PrivilegedAuthRoute => {
  return !!route && !!(route as PrivilegedAuthRoute).rolesAllowed;
};

const checkActiveRouteType = (
  path: string,
  publicRoutes: PublicRoute[],
  privateRoutes: PrivilegedAuthRoute[]
): PrivilegedAuthRoute | PublicRoute | undefined => {
  const pathWithoutQueryParams = path.split('?')[0];
  const publicRouteInfo = publicRoutes.find(
    (route) =>
      (route.route === '/' && pathWithoutQueryParams === '/') ||
      (route.route !== '/' &&
        (pathWithoutQueryParams === route.route ||
          pathWithoutQueryParams.startsWith(route.route + '/')))
  );
  const privilegedRouteInfo = privateRoutes?.find(
    (route) =>
      (route.route === '/' && pathWithoutQueryParams === '/') ||
      (route.route !== '/' &&
        (pathWithoutQueryParams === route.route ||
          pathWithoutQueryParams.startsWith(route.route + '/')))
  );

  return publicRouteInfo ? publicRouteInfo : privilegedRouteInfo;
};

const getRedirectRoute = (
  redirectOnLogin: RedirectRoute,
  accountRole: UserAccountRole
): string => {
  return redirectOnLogin[accountRole];
};

const isRoleAllowed = (
  rolesAllowed: PrivilegedAuthRoute['rolesAllowed'],
  accountRole: UserAccountRole
): boolean => {
  return !!rolesAllowed?.includes(accountRole);
};
