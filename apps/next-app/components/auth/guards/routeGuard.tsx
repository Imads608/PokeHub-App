import { NextRouter, useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getIsAuthenticated, getAuthLoading } from '../../../store/selectors/auth';
import { RootState } from '../../../store/store';

/**
 * A Component which handles routing a User to the appropriate page based on whether he/she is authenticated.
 * Hides the Content of a Page until Auth Loading is false and then unhides the content.
 * @param param0  The Inner React Components that need to be Route Protected
 * @returns A Component which if placed as a parent over other components will have Auth Routing handled
 */
const RouteGuard = ({ children }: { children: JSX.Element }) => {
    const router: NextRouter = useRouter();
    const isAuthenticated: boolean = useSelector<RootState, boolean>(getIsAuthenticated);
    const authLoading: boolean = useSelector<RootState, boolean>(getAuthLoading);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        console.log('RouteGuard: Checking auth');
        authCheck(router.asPath);
        // on route change start - hide page content by setting authorized to false
        const hideContent = () => setAuthorized(false);
        
        router.events.on('routeChangeStart', hideContent);

        // on route change complete - run auth check
        router.events.on('routeChangeComplete', authCheck);

        // unsubscribe from events in useEffect return function
        return () => {
            router.events.off('routeChangeStart', hideContent);
            router.events.off('routeChangeComplete', authCheck);
        };
    }, [isAuthenticated, authLoading]);

    const redirectToPrivatePage = () => {
        if (router.query && router.query.from) {
        router.push(router.query.from as string);
        } else {
        router.push('/dashboard');
        }
    };

    const authCheck = (url: string) => {
        // redirect to login page if accessing a private page and not logged in and to private route if logged in
        const publicPaths = ['/', '/login', '/register', '/register/activate', '/login/password-reset', '/login/password-reset/edit'];
        const path = url.split('?')[0];

        console.log('routeGuard: Authenticated:', isAuthenticated, authLoading, path);
        if (!authLoading && !isAuthenticated && !publicPaths.includes(path)) {
            setAuthorized(false);
            router.push({
                pathname: '/login',
                query: { from: router.pathname },
            });
        } else if (!authLoading) {
            setAuthorized(true);
            isAuthenticated && publicPaths.includes(path) && redirectToPrivatePage();
        }
    };

    return authorized && children;
};

export default RouteGuard;
