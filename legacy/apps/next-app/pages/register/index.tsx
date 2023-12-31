import {
  Avatar,
  Box,
  Button,
  Container,
  CssBaseline,
  Grid,
  PaletteMode,
  Typography,
} from '@mui/material';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useSignupUser } from '../../hooks/auth/signup-user.hook';
import NextLink from 'next/link';
import Copyright from '../../components/common/copyright.component';
import withLoadUser from '../../hoc/auth/load-user.hoc';
import { RootState, wrapper } from '../../store/store';
import { GetServerSideProps } from 'next';
import { useSelector } from 'react-redux';
import { getIsAuthenticated, getIsEmailVerified } from '../../store/auth/auth.selector';
import { useEffect } from 'react';
import { AxiosError } from 'axios';
import { APIError } from '../../types/api';
import { toast } from 'react-toastify';
import { getPaletteTheme } from '../../store/app/app.selector';
import EmailVerificationNotification from '../../components/auth/notifications/email-verification-notification.component';
import GoogleButton from 'react-google-button';
import appConfig from '../../config';
import { useTheme } from '@mui/material/styles';
import { useAuthFormStyles } from '../../hooks/styles/auth/auth-form.styles';
import PasswordField from 'apps/next-app/components/auth/fields/password-field/password-field.component';
import EmailField from 'apps/next-app/components/auth/fields/email-field/email-field.component';
import UsernameField from 'apps/next-app/components/auth/fields/username-field/username-field.component';
import PageLayout from 'apps/next-app/components/common/page-layout/page-layout.component';

export const getServerSideProps: GetServerSideProps = wrapper.getServerSideProps((store) => async ({ req, res }) => {
  if (!store.getState()['auth-state'].isAuthenticated)
    await withLoadUser.isAuth({ req, res, store, isOAuthLogin: false });
  return {
    props: {
    }
  }
})

const Register = () => {
  const mutation = useSignupUser();

  const isAuthenticated = useSelector<RootState, boolean>(getIsAuthenticated);
  const isEmailVerified = useSelector<RootState, boolean>(getIsEmailVerified);
  const mode = useSelector<RootState, PaletteMode>(getPaletteTheme)

  const { handleSubmit, getValues, control, formState: { errors } } = useForm({ mode: 'onChange' });
  const theme = useTheme();
  const { classes } = useAuthFormStyles();

  const signupError: AxiosError<APIError> = mutation.error as AxiosError<APIError>;

  //const emailFieldControllerProps: UseControllerProps<FieldValues, string> = useEmailAvailability(control);
  
  useEffect(() => {
    signupError && toast.error(signupError.response?.data.message,
        {
          position: toast.POSITION.TOP_CENTER,
          theme: mode,
        }
      );
  }, [signupError]);

  return (
    <PageLayout>
      <main>
        <EmailVerificationNotification />
        <Container component="main" maxWidth="xs">
          <CssBaseline />
          <div className={classes.paper}>
            <Avatar className={classes.avatar}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Sign up
            </Typography>
            <form
              className={classes.form}
              onSubmit={handleSubmit((data) =>
                mutation.mutate({
                  email: data.email,
                  username: data.username,
                  password: data.password,
                })
              )}
            >
              <EmailField control={control} />
              <UsernameField control={control} />
              <PasswordField control={control} />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={mutation.isLoading || (isAuthenticated && !isEmailVerified)}
                className={classes.submit}
              >
                Sign Up
              </Button>
              <a href={`${appConfig.apiGateway}/auth/oauth-google-login`} style={{ textDecoration: 'none' }}>
                <GoogleButton
                  style={{ borderRadius: '5px', width: '100%' }}
                />
              </a>
              <Grid container justifyContent="flex-start">
                <Grid item>
                  <NextLink href="/register">
                    <a style={{ textDecoration: 'none' }}>
                      {'Already have an account? Sign In'}
                    </a>
                  </NextLink>
                </Grid>
              </Grid>
            </form>
          </div>
          <Box mt={5}>
            <Copyright />
          </Box>
        </Container>
      </main>
    </PageLayout>
  );
};

export default withLoadUser(Register);
