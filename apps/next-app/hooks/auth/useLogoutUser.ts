import { useQuery, UseQueryResult } from 'react-query';
import { useDispatch } from 'react-redux';
//import { authFailure, loggedIn, setAuthLoaded } from "../actions/auth";
import { logout } from '../../store/actions/common';
import { logoutUserProxy as logoutUser } from '../../api/auth';
import { AxiosError } from 'axios';
import { APIError } from '../../types/api';
import { Dispatch } from '@reduxjs/toolkit';

export const useLogoutUser = (userId: string, enable: boolean) => {
  const dispatch: Dispatch = useDispatch();
  const res: UseQueryResult<{ message: string }, Error | AxiosError<APIError> > = useQuery(['users', 'logout', { id: userId }], 
    async () => await logoutUser(), 
    {
      onSuccess: (data: { message: string }) => {
        console.log('useLogoutUser: data:', data);
        dispatch(logout());
      },
      onError: (err: Error | AxiosError<APIError>) => {
        console.log('Got error: ', err);
      },
      enabled: enable ? true : false,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: Infinity,
    });
    
  return res;
};