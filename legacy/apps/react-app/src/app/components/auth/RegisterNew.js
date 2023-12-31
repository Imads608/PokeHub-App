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
import { Link, useHistory } from 'react-router-dom';
import { useSignupUser } from '../../hooks/useSignupUser';
import EmailField from './EmailField';
import GoogleOAuth from './GoogleOAuth';
import PasswordField from './PasswordField';
import UsernameField from './UsernameField';
import { connect } from 'react-redux';
import { getIsAuthenticated } from '../../selectors/auth';
import { useEffect } from 'react';

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

const RegisterNew = ({ isAuthenticated }) => {
  const classes = useStyles();
  const mutation = useSignupUser();
  const history = useHistory();
  const {
    handleSubmit,
    getValues,
    control,
    formState: { errors },
  } = useForm({ mode: 'onChange' });

  const redirectToPrivatePage = () => {
    if (location.state && location.state.from)
      history.push(location.state.from);
    else history.push('/dashboard');
  };

  useEffect(() => {
    isAuthenticated && redirectToPrivatePage();
  }, [isAuthenticated]);

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
          <GoogleOAuth classes={classes} />
          <Grid container justifyContent="flex-start">
            <Grid item>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                Already have an account? Sign in
              </Link>
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

const mapStateToProps = (state) => ({
  isAuthenticated: getIsAuthenticated(state),
});

export default connect(mapStateToProps, null)(RegisterNew);
