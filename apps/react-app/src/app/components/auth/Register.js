import React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
//import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import withStyles from '@mui/styles/withStyles';
import Container from '@mui/material/Container';
import { ErrorOutlineSharp } from '@mui/icons-material';
//import { signInWithGoogle } from '../../firebase';
import { connect } from 'react-redux';
import { googleSignIn, createUser } from '../../middleware-thunks/auth';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import { getIsAuthenticated } from '../../selectors/auth';
import { Link } from 'react-router-dom';

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
  avatarUser: {
    display: 'flex',
    '& > *': {
      margin: theme.spacing(1),
    },
    width: theme.spacing(7),
    height: theme.spacing(7)
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
});

class Register extends React.Component {

    state = {
        email: {
            error: null,
            value: ''
        },
        password: {
            error: null,
            value: ''
        },
        username: {
            error: null,
            value: ''
        },
        avatar: {
            file: null,
            image: null
        }
    }

    validateSignup() {
        let error = { errorEmail: this.state.email.error,
                      errorPass: this.state.password.error, errorUN: this.state.username.error}
        if (error.errorPass === null && this.state.password.value === '') error.errorPass = 'Password is required'
        if (error.errorEmail === null && this.state.email.value === '') error.errorEmail = 'Email is required'
        if (error.errorUN === null && this.state.username.value === '') error.errorUN = 'Username is required'
        return error
    }

    onSignUp = (e) => {
        e.preventDefault();
        const { errorEmail, errorPass, errorUN } = this.validateSignup();
        this.setState((currentState) => ({
            email: { ...currentState.email, error: errorEmail},
            password: { ...currentState.password, error: errorPass},
            username: { ...currentState.username, error: errorUN},
        }));
        if (errorEmail === null && errorPass === null && errorUN === null) {
            this.props.createUser(this.state.username.value, this.state.email.value, this.state.password.value);//alert('Submitted');
        }
    }

    onGoogleSignUp = (e) => {
        e.preventDefault();
        this.props.googleSignIn();
    } 

    onFieldChange = (e) => {
        this.setState({
            [e.target.name]: {value: e.target.value, error: null}
        });
    }

    onEmailChange = (e) => {
        const value = e.target.value;
        let error = null;

        if (value === '') {
            error = 'Email is required';
        } else if (!value.includes('@') || value.slice(-1) === '@') {
            error = 'Invalid Email';
        }
        console.log('Value', value);

        this.setState({
            email: { value, error }
        });
    }

    onPasswordChange = (e) => {
        const value = e.target.value;
        let error = null;

        if (value === '') {
            error = 'Password is required'
        } else if (value.length < 7) {
            error = 'Password must be at least 7 characters long'
        }

        this.setState({
            password: { value, error }
        })
    }

    onAvatarSelect = (e) => {
        this.setState({
            avatar: {
                file: e.target.files[0],
                image: URL.createObjectURL(e.target.files[0])
            }
        });
        //this.setState({ avatar: {avatarFile: e.target.files[0], avatarImage: URL.createObjectURL(e.target.files[0])})
    }

    render() {
        const { classes, isAuthenticated } = this.props;

        if (isAuthenticated) {
            return <Redirect to='/dashboard' />
        }

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
                <form className={classes.form} noValidate>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                variant="outlined"
                                required
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                autoComplete="uname"
                                onChange={this.onFieldChange}
                                value={this.state.username.value}
                                error={this.state.username.error ? true : false}
                                helperText={this.state.username.error}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                variant="outlined"
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                value={this.state.email.value}
                                onChange={this.onEmailChange}
                                error={this.state.email.error ? true : false}
                                helperText={this.state.email.error}                              
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                variant="outlined"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                value={this.state.password.value}
                                onChange={this.onPasswordChange}
                                error={this.state.password.error ? true : false}
                                helperText={this.state.password.error}
                            />
                        </Grid>
                        <Grid item xs={10}>
                            <div style={{display: 'flex'}}>
                                <Avatar 
                                    className={classes.avatarUser} 
                                    style={{marginRight: '10px'}} 
                                    src={`${this.state.avatar.image ? this.state.avatar.image : '/broken-image.jpeg'}`}
                                />
                                <input
                                    style={{ display: "none" }}
                                    id="contained-button-file"
                                    type="file"
                                    accept="image/*"
                                    onChange={this.onAvatarSelect}
                                />
                                <label htmlFor="contained-button-file">
                                    <Button style={{marginTop: '7px'}} variant="contained" component="span">
                                    Upload Avatar Image
                                    </Button>
                                </label>
                            </div>
                        </Grid>
                    </Grid>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                        onClick={this.onSignUp}
                    >
                        Sign Up
                    </Button>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="secondary"
                        className={classes.submit}
                        onClick={this.onGoogleSignUp}
                    >
                        Sign Up With Google
                    </Button>
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
    }
}

Register.propTypes = {
    classes: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    googleSignIn: PropTypes.func.isRequired,
    createUser: PropTypes.func.isRequired,
    isAuthenticated: PropTypes.bool.isRequired,
}


const mapStateToProps = (state) => ({
    isAuthenticated: getIsAuthenticated(state),
})

export default connect(mapStateToProps, { googleSignIn, createUser })(withStyles(styles)(Register));
