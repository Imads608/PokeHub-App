import React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import withStyles from '@mui/styles/withStyles';
import Container from '@mui/material/Container';
import { connect } from 'react-redux';
import { googleSignIn, defaultLogIn } from '../../middleware-thunks/auth';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import { getIsAuthenticated } from '../../selectors/auth';
import { Link as RouterLink } from 'react-router-dom';
import GoogleLogin from 'react-google-login';
import GoogleOAuth from './GoogleOAuth';

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © PokeHub '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const styles = (theme) => ({
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
});

class Login extends React.Component {
  state = {
    email: '',
    password: '',
    errorEmail: '',
    errorPassword: '',
  };

  validateEmail = (value) => {
    if (!value.includes('@')) {
      this.setState({ errorEmail: 'Invalid Email' });
    } else if (value.slice(-1) !== '@') {
      this.setState({ errorEmail: '' });
    }
  };

  onEmailChange = (e) => {
    const currVal = e.target.value;
    this.setState({
      email: currVal,
    });
    if (currVal === '') {
      this.setState({ errorEmail: 'Email is required' });
    } else if (!currVal.includes('@')) {
      this.setState({ errorEmail: 'Invalid Email' });
    } else if (currVal.slice(-1) !== '@') {
      this.setState({ errorEmail: '' });
    }
  };

  onPasswordChange = (e) => {
    const currVal = e.target.value;
    this.setState({
      password: currVal,
    });

    if (currVal === '') {
      this.setState({ errorPassword: 'Password is required' });
    } else {
      this.setState({ errorPassword: '' });
    }
  };

  onSubmit = (e) => {
    e.preventDefault();
    if (this.state.email === '' && this.state.password === '') {
      this.setState({
        errorEmail: 'Email is required',
        errorPassword: 'Password is required',
      });
    } else if (this.state.email === '') {
      this.setState({ errorEmail: 'Email is required' });
    } else if (this.state.password === '') {
      this.setState({ errorPassword: 'Password is required' });
    } else if (
      this.state.errorEmail === '' &&
      this.state.errorPassword === ''
    ) {
      this.props.defaultLogIn(this.state.email, this.state.password);
    }
  };

  onGoogleSignIn = (e) => {
    e.preventDefault();
    this.props.googleSignIn();
  };

  redirectToPrivatePage = () => {
    const { classes, isAuthenticated } = this.props;

    if (
      isAuthenticated &&
      this.props.location.state &&
      this.props.location.state.from
    ) {
      this.props.history.push(this.props.location.state.from);
    } else if (isAuthenticated) {
      this.props.history.push('/dashboard');
    }
  };

  componentDidMount() {
    this.redirectToPrivatePage();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.isAuthenticated !== this.props.isAuthenticated) {
      this.redirectToPrivatePage();
    }
  }

  render() {
    const { classes } = this.props;
    console.log('Google Client Id', process.env.NX_GOOGLE_CLIENT_ID);

    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign inb
          </Typography>
          <form className={classes.form} noValidate>
            <TextField
              value={this.state.email}
              onChange={this.onEmailChange}
              variant="outlined"
              margin="normal"
              required
              error={this.state.errorEmail.length > 0 ? true : false}
              helperText={this.state.errorEmail}
              fullWidth
              id="email"
              type="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              value={this.state.password}
              onChange={this.onPasswordChange}
              error={this.state.errorPassword.length > 0 ? true : false}
              helperText={this.state.errorPassword}
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
            />
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
              onClick={this.onSubmit}
            >
              Sign In
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              className={classes.submit}
              onClick={this.onGoogleSignIn}
            >
              Sign In with Google
            </Button>
            <GoogleOAuth />
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
    );
  }
}

Login.propTypes = {
  classes: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  googleSignIn: PropTypes.func.isRequired,
  defaultLogIn: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
};

const mapStateToProps = (state) => ({
  isAuthenticated: getIsAuthenticated(state),
});

export default connect(mapStateToProps, { googleSignIn, defaultLogIn })(
  withStyles(styles)(Login)
);
