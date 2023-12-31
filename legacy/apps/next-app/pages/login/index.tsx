/* eslint-disable @typescript-eslint/no-empty-function */
import { Box, Container, Grid, Typography, Button, FormControlLabel, Checkbox, Link, PaletteMode, Avatar, } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import useLoginUser from '../../hooks/auth/login-user.hook';
import { getIsAuthenticated, getIsEmailVerified, } from '../../store/auth/auth.selector';
import { useSelector } from 'react-redux';
import { RootState, wrapper } from '../../store/store';
import NextLink from 'next/link';
import { APIError } from '../../types/api';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { Dispatch } from 'redux';
import { useDispatch } from 'react-redux';
import { reset_auth_failure } from '../../store/auth/auth.reducer';
import { getPaletteTheme } from '../../store/app/app.selector';
import EmailVerificationNotification from '../../components/auth/notifications/email-verification-notification.component';
import Copyright from '../../components/common/copyright.component';
import { GetServerSideProps } from 'next';
import withOAuthLoad from '../../hoc/auth/oauth-load.hoc';
import GoogleButton from 'react-google-button';
import appConfig from '../../config';
import { useTheme } from '@mui/material/styles';
import { useAuthFormStyles } from '../../hooks/styles/auth/auth-form.styles';
import EmailField from 'apps/next-app/components/auth/fields/email-field/email-field.component';
import PasswordField from 'apps/next-app/components/auth/fields/password-field/password-field.component';
import PageLayout from 'apps/next-app/components/common/page-layout/page-layout.component';

export const getServerSideProps: GetServerSideProps = wrapper.getServerSideProps((store) => async ({ req, res, query }) => {
  const oauthToken = query.oauth_token ? query.oauth_token as string : null;

  if (oauthToken)
    await withOAuthLoad.isAuth({ req, res, store, oauthToken });
  return {
    props: {
    }
  }
})

const Login = () => {
  const localStorageRememberMe: string = localStorage['pokehub-rememberme'];
  const [loginEnable, setLoginEnable] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(!localStorageRememberMe || localStorageRememberMe === 'undefined' || localStorageRememberMe === 'false' ? false : true);
  const isAuthenticated: boolean = useSelector<RootState, boolean>(getIsAuthenticated);
  const isEmailVerified: boolean = useSelector<RootState, boolean>(getIsEmailVerified);
  const mode: PaletteMode = useSelector<RootState, PaletteMode>(getPaletteTheme);
  const dispatch: Dispatch = useDispatch();
  const { handleSubmit, getValues, control, formState: { errors } } = useForm({ mode: 'onChange' });
  const result = useLoginUser(getValues('email'), getValues('password'), rememberMe, loginEnable);
  const error: AxiosError<APIError> = result.error as AxiosError<APIError>;
  const theme = useTheme();
  const { classes } = useAuthFormStyles();

  const notificationClose = () => {
    dispatch(reset_auth_failure());
  };

  const enableUserLogin = () => {
    setLoginEnable(true);
  }

  const toggleRememberMe = () => {
    console.log('toggleRememberMe login');
    localStorage['pokehub-rememberme'] = rememberMe ? 'false' : 'true';
    setRememberMe(!rememberMe);
  }

  useEffect(() => {
    result.isError && setLoginEnable(false);
    !isAuthenticated && isEmailVerified && setLoginEnable(false);
    error && toast.error(error.response?.data.statusCode === 401 ? 'Invalid Credentials' : error.response?.data.message,
        {
          position: toast.POSITION.TOP_CENTER,
          onClose: notificationClose,
          theme: mode,
        }
      );
  }, [error, isAuthenticated, result.isSuccess]);

  useEffect(() => {
    setLoginEnable(false);
  }, []);

  console.log('Result Loading', result.isLoading);

  return (
    <PageLayout>
      <main>
        <EmailVerificationNotification />
        <Container component="main" maxWidth="xs">
          <div className={classes.paper}>
            <Avatar className={classes.avatar}>
              <LockOutlined />
            </Avatar>
            <Typography component="h1" variant="h5">
              Sign in
            </Typography>
            <form
              className={classes.form}
              onSubmit={handleSubmit((data) => enableUserLogin())}
            >
              <EmailField control={control} />
              <PasswordField control={control} />
              <FormControlLabel checked={rememberMe} control={ <Checkbox value="remember" color="primary" onChange={() => toggleRememberMe()} /> }
                label="Remember me"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={result.isLoading}
                className={classes.submit}
              >
                Sign In
              </Button>
              <a href={`${appConfig.apiGateway}/auth/oauth-google-login`} style={{ textDecoration: 'none' }}>
                <GoogleButton
                  style={{ borderRadius: '5px', width: '100%' }}
                />
              </a>
              <Grid container>
                <Grid item xs>
                  <Link href="/login/password-reset" variant="body2">
                    Forgot password?
                  </Link>
                </Grid>
                <Grid item>
                  <NextLink href="/register">
                    <a style={{ textDecoration: 'none' }}>
                      {"Don't have an account? Sign Up"}
                    </a>
                  </NextLink>
                </Grid>
              </Grid>
            </form>
          </div>
          <Box mt={8}>
            <Copyright />
          </Box>
        </Container>
      </main>
    </PageLayout>
  );
};

export default withOAuthLoad(Login);
