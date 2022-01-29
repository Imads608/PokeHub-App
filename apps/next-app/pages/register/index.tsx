import {
  Avatar,
  Box,
  Button,
  Container,
  CssBaseline,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useSignupUser } from '../../hooks/auth/useSignupUser';
import EmailField from '../../components/auth/fields/emailField';
import GoogleOAuth from '../../components/auth/oauth/googleOAuth';
import PasswordField from '../../components/auth/fields/passwordField';
import UsernameField from '../../components/auth/fields/usernameField';
import { Theme } from '@mui/material/styles';
import NextLink from 'next/link';
import Copyright from '../../components/common/copyright';
import withLoadUser from '../../hoc/auth/withLoadUser';
import { wrapper } from '../../store/store';
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = wrapper.getServerSideProps((store) => async ({ req, res }) => {
  if (!store.getState()['auth-state'].isAuthenticated)
    await withLoadUser.isAuth({ req, res, store});
  return {
    props: {
    }
  }
})

const useStyles = makeStyles((theme: Theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

const Register = () => {
  const classes = useStyles();
  const mutation = useSignupUser();

  const { handleSubmit, getValues, control, formState: { errors } } = useForm({ mode: 'onChange' });

  return (
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
            className={classes.submit}
          >
            Sign Up
          </Button>
          <GoogleOAuth classes={classes} notificationClose={null} />
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
  );
};

export default withLoadUser(Register);
