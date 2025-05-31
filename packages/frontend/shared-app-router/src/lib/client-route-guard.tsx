'use client';

import type {
  PrivilegedAuthRoute,
  PublicRoute,
  RedirectRoute,
  RouteGuardProps,
} from './models/router';
import { AuthContext } from '@pokehub/frontend/shared-auth-context';
import type { UserAccountRole } from '@pokehub/shared/shared-user-models';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';

export const ClientRouteGuard = ({
  children,
  loginPath,
  publicPaths,
  redirectOnLogin,
  onLogout,
  privilegedRoutes,
}: RouteGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const queryParams = useSearchParams();
  const {
    isAuthenticated,
    loading: authLoading,
    accountRole,
  } = useContext(AuthContext);
  const [currAuthStatus, setCurrAuthStatus] = useState<boolean>(
    !!isAuthenticated.value
  );
  const [authorized, setAuthorized] = useState<boolean>(() => {
    const routeType = checkActiveRouteType(
      pathname,
      publicPaths,
      privilegedRoutes || []
    );
    return (
      isPublicRoute(routeType) &&
      ((isAuthenticated.value &&
        !authLoading.value &&
        routeType.isAuthAccessible) ||
        !isAuthenticated.value)
    );
  });

  /* Trigger on Authentication Change */
  useEffect(() => {
    authCheck(pathname, true);
    setCurrAuthStatus(!!isAuthenticated.value);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated.value, authLoading.value]);

  /* Trigger on Page Change */
  useEffect(() => {
    authCheck(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const authCheck = (url: string, authChange?: boolean) => {
    const path = url.split('?')[0];
    const routeType = checkActiveRouteType(
      path,
      publicPaths,
      privilegedRoutes || []
    );

    if (
      !authLoading.value &&
      !isAuthenticated.value &&
      !isPublicRoute(routeType)
    ) {
      setAuthorized(false);
      router.push(`${loginPath}?from=${path}`);
    } else if (!authLoading.value) {
      if (
        isAuthenticated.value &&
        isPrivateRoute(routeType) &&
        accountRole.value &&
        !isRoleAllowed(routeType.rolesAllowed, accountRole.value)
      ) {
        router.push(getRedirectRoute(redirectOnLogin, accountRole.value));
      } else if (
        isAuthenticated.value &&
        accountRole.value &&
        isPublicRoute(routeType) &&
        !routeType.isAuthAccessible
      ) {
        redirectToDefaultPrivilegedPage(accountRole.value);
      } else if (authChange && !isAuthenticated.value && currAuthStatus) {
        onLogout?.();
        router.refresh();
        setAuthorized(true);
      } else {
        setAuthorized(true);
      }
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
