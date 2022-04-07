import { Button, PaletteMode } from '@mui/material';
import { ClassNameMap } from '@mui/styles/withStyles';
import React, { useEffect, useState } from 'react';
import { GoogleLogin, GoogleLoginResponse } from 'react-google-login';
import { useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { auth_failure } from '../../../store/actions/common';
import { useGoogleOAuthLogin } from '../../../hooks/auth/useGoogleOAuthLogin';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { APIError } from '../../../types/api';
import { getAppTheme } from '../../../store/selectors/app';
import { RootState } from '../../../store/store';

interface GoogleOAuthProps {
  classes: ClassNameMap<'paper' | 'avatar' | 'form' | 'submit'>;
  notificationClose: () => void;
}

const GoogleOAuth = ({ classes, notificationClose }: GoogleOAuthProps) => {
  //const mutation = useGoogleOAuthLogin();
  const dispatch = useDispatch();
  //const error = mutation.error as AxiosError<APIError>;
  const theme: PaletteMode = useSelector<RootState, PaletteMode>(getAppTheme);

  /*useEffect(() => {
    error &&
      toast.error(
        error.response?.data.statusCode === 401
          ? 'Invalid Credentials'
          : error.response?.data.message,
        {
          position: toast.POSITION.TOP_CENTER,
          onClose: notificationClose,
          theme,
        }
      );
  }, [error]);*/

  return (
    <GoogleLogin
      clientId={process.env.NX_APP_GOOGLE_CLIENT_ID}
      render={(renderProps) => (
        <Button
          fullWidth
          variant="contained"
          color="secondary"
          className={classes.submit}
          onClick={renderProps.onClick}
        >
          Sign In with Google
        </Button>
      )}
      buttonText="Login with Google"
      onSuccess={(data) => {
        console.log('Got data:', data);
        //mutation.mutate((data as GoogleLoginResponse).tokenId);
      }}
      onFailure={(err) => console.log('GoogleLogin: failure')}
      cookiePolicy={'single_host_origin'}
    />
  );
};

export default GoogleOAuth;
