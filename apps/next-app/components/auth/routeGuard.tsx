import { NextRouter, useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getIsAuthenticated, getAuthLoading } from '../../store/selectors/auth';
import { RootState } from '../../store/store';

const RouteGuard = ({ children }: { children: JSX.Element }) => {
    const router: NextRouter = useRouter();
    const isAuthenticated: boolean = useSelector<RootState, boolean>(getIsAuthenticated);
    const authLoading: boolean = useSelector<RootState, boolean>(getAuthLoading);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        console.log('Checking');
        authCheck(router.asPath);
        // on route change start - hide page content by setting authorized to false  
        const hideContent = () => setAuthorized(false);
        router.events.on('routeChangeStart', hideContent);

        // on route change complete - run auth check 
        router.events.on('routeChangeComplete', authCheck)

        // unsubscribe from events in useEffect return function
        return () => {
            router.events.off('routeChangeStart', hideContent);
            router.events.off('routeChangeComplete', authCheck);
        }

    }, [isAuthenticated]);

    const authCheck = (url: string) => {
        // redirect to login page if accessing a private page and not logged in 
        const publicPaths = ['/login', '/register', '/register/activate', '/login/password-reset'];
        const path = url.split('?')[0];
        console.log('Authenticated:', isAuthenticated, authLoading, path);
        if (!authLoading && !isAuthenticated && !publicPaths.includes(path)) {
            setAuthorized(false);
            router.push({
                pathname: '/login',
                query: { from: router.pathname }
            });
        } else if (!authorized) {
            setAuthorized(true);
        }
    }

    return authorized && children;
}

export default RouteGuard;