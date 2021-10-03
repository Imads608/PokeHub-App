import { Button } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { GoogleLogin } from 'react-google-login';
import { useQuery } from 'react-query';
import { useDispatch } from 'react-redux';
import { authFailure } from '../../actions/auth';
import { useGoogleOAuthLogin } from '../../hooks/useGoogleOAuthLogin';
const GoogleOAuth = ({ classes }) => {
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
                mutation.mutate(data.tokenId);
            }}
            onFailure={(err) => dispatch(authFailure(err))}
            cookiePolicy={'single_host_origin'}
        />
    )

}

export default GoogleOAuth;