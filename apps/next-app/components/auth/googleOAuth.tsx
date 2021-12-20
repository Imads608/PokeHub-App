import { Button } from '@mui/material';
import { ClassNameMap } from '@mui/styles/withStyles';
import React, { useEffect, useState } from 'react';
import { GoogleLogin, GoogleLoginResponse } from 'react-google-login';
import { useQuery } from 'react-query';
import { useDispatch } from 'react-redux';
import { auth_failure } from '../../store/actions/common';
import { useGoogleOAuthLogin } from '../../hooks/auth/useGoogleOAuthLogin';


interface GoogleOAuthProps {
    classes: ClassNameMap<"paper" | "avatar" | "form" | "submit">
}

const GoogleOAuth = ({ classes }: GoogleOAuthProps) => {
    const mutation = useGoogleOAuthLogin();
    const dispatch = useDispatch();

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
            buttonText='Login with Google'
            onSuccess={(data) => {
                console.log('Got data:', data);
                mutation.mutate((data as GoogleLoginResponse).tokenId);
            }}
            onFailure={(err) => dispatch(auth_failure(err))}
            cookiePolicy={'single_host_origin'}
        />
    )

}

export default GoogleOAuth;