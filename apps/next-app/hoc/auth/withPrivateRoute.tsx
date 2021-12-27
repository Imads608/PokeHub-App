/* eslint-disable react/display-name */
/* eslint-disable react-hooks/rules-of-hooks */

import { getIsAuthenticated, getAuthLoading } from '../../store/selectors/auth';
import { NextRouter, useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import Notification from '../../components/notification/notification';

const WithPrivateRoute = (WrappedComponent) => {
  return (props) => {
    const router: NextRouter = useRouter();
    const isAuthenticated: boolean = useSelector<RootState, boolean>(
      getIsAuthenticated
    );
    const authLoading: boolean = useSelector<RootState, boolean>(
      getAuthLoading
    );

    const redirectToLoginPage = () => {
      router.push({
        pathname: '/login',
        query: { from: router.pathname },
      });
    };

    useEffect(() => {
      !isAuthenticated && !authLoading && redirectToLoginPage();
    }, [authLoading]);

    if (authLoading) {
      return <Notification />;
    }
    return <WrappedComponent {...props} />;
  };
};

export default WithPrivateRoute;
