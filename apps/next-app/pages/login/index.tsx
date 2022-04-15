/* eslint-disable @typescript-eslint/no-empty-function */
import { Avatar, Box, Container, CssBaseline, Grid, TextField, Typography, Button, FormControlLabel, Checkbox, Link, PaletteMode, } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { LockOutlined } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { FieldValues, UseControllerProps, useForm } from 'react-hook-form';
import useLoginUser from '../../hooks/auth/useLoginUser';
import EmailField from '../../components/auth/fields/emailField';
import PasswordField from '../../components/auth/fields/passwordField';
import { getIsAuthenticated, getIsEmailVerified, } from '../../store/selectors/auth';
import { Theme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { RootState, wrapper } from '../../store/store';
import NextLink from 'next/link';
import { APIError } from '../../types/api';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { Dispatch } from 'redux';
import { useDispatch } from 'react-redux';
import { reset_auth_failure } from '../../store/reducers/auth';
import { getUser } from '../../store/selectors/user';
import { IUserData } from '@pokehub/user/interfaces';
import { getAppTheme } from '../../store/selectors/app';
import EmailVerificationNotification from '../../components/auth/notifications/emailVerificationNotification';
import { QueryClient, useQueryClient } from 'react-query';
import Copyright from '../../components/common/copyright';
import withLoadUser from '../../hoc/auth/withLoadUser';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import withOAuthLoad from '../../hoc/auth/withOAuthLoad';
import GoogleButton from 'react-google-button';
import appConfig from '../../config';

const useStyles = makeStyles((theme: Theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

export const getServerSideProps: GetServerSideProps = wrapper.getServerSideProps((store) => async ({ req, res, query }) => {
  const oauthToken = query.oauth_token ? query.oauth_token as string : null;

  if (oauthToken && !store.getState()['auth-state'].isAuthenticated)
    await withOAuthLoad.isAuth({ req, res, store, oauthToken });
  return {
    props: {
    }
  }
})

const Login = () => {
  const localStorageRememberMe: string = localStorage['pokehub-rememberme'];
  const classes = useStyles();
  const [loginEnable, setLoginEnable] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(!localStorageRememberMe || localStorageRememberMe === 'undefined' || localStorageRememberMe === 'false' ? false : true);
  const isAuthenticated: boolean = useSelector<RootState, boolean>(getIsAuthenticated);
  const isEmailVerified: boolean = useSelector<RootState, boolean>(getIsEmailVerified);
  const user: IUserData = useSelector<RootState, IUserData>(getUser);
  const theme: PaletteMode = useSelector<RootState, PaletteMode>(getAppTheme);
  const dispatch: Dispatch = useDispatch();
  const queryClient: QueryClient = useQueryClient();
  const { handleSubmit, getValues, control, formState: { errors } } = useForm({ mode: 'onChange' });
  const result = useLoginUser(getValues('email'), getValues('password'), rememberMe, loginEnable);
  const error: AxiosError<APIError> = result.error as AxiosError<APIError>;

  const notificationClose = () => {
    dispatch(reset_auth_failure());
  };

  const enableUserLogin = () => {
    //queryClient.removeQueries('user-login');
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
    //!isAuthenticated && !isEmailVerified && queryClient.removeQueries('user-login');
    error && toast.error(error.response?.data.statusCode === 401 ? 'Invalid Credentials' : error.response?.data.message,
        {
          position: toast.POSITION.TOP_CENTER,
          onClose: notificationClose,
          theme,
        }
      );
  }, [error, isAuthenticated, result.isSuccess]);

  useEffect(() => {
    setLoginEnable(false);
  }, []);

  console.log('Result Loading', result.isLoading);

  return (
    <div>
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
    </div>
  );
};

export default withOAuthLoad(Login);
