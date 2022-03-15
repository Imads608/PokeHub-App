import {
  Avatar,
  Box,
  Container,
  CssBaseline,
  Grid,
  TextField,
  Typography,
  Button,
  FormControlLabel,
  Checkbox,
  Link,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { LockOutlined } from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { Controller, useController, useForm } from 'react-hook-form';
import useLoginUser from '../../hooks/useLoginUser';
import EmailField from './EmailField';
import PasswordField from './PasswordField';
import GoogleOAuth from './GoogleOAuth';
import {
  Link as RouterLink,
  Redirect,
  useHistory,
  useLocation,
} from 'react-router-dom';
import { connect } from 'react-redux';
import { getIsAuthenticated } from '../../selectors/auth';

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © PokeHub '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const useStyles = makeStyles((theme) => ({
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

const LoginNew = ({ isAuthenticated }) => {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const [loginEnable, setLoginEnable] = useState(false);

  console.log('Login Enable is: ', loginEnable);
  const {
    handleSubmit,
    getValues,
    control,
    formState: { errors },
  } = useForm({ mode: 'onChange' });
  const { error } = useLoginUser(
    getValues('email'),
    getValues('password'),
    loginEnable
  );

  const redirectToPrivatePage = () => {
    if (location.state && location.state.from)
      history.push(location.state.from);
    else history.push('/dashboard');
  };

  useEffect(() => {
    !isAuthenticated && setLoginEnable(false);
    isAuthenticated && redirectToPrivatePage();
  }, [error, isAuthenticated]);

  useEffect(() => {
    setLoginEnable(false);
  }, []);

  return (
    <div>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <LockOutlined />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <form
            className={classes.form}
            onSubmit={handleSubmit((data) => setLoginEnable(true))}
          >
            <EmailField control={control} />
            <PasswordField control={control} />
            <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
            >
              Sign In
            </Button>
            <GoogleOAuth classes={classes} />
            <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <RouterLink to="/register" style={{ textDecoration: 'none' }}>
                  {"Don't have an account? Sign Up"}
                </RouterLink>
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

const mapStateToProps = (state) => ({
  isAuthenticated: getIsAuthenticated(state),
});

export default connect(mapStateToProps, null)(LoginNew);
