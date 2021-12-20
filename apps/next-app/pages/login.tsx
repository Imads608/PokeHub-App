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
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import useLoginUser from '../hooks/auth/useLoginUser';
import EmailField from '../components/auth/emailField';
import PasswordField from '../components/auth/passwordField';
import GoogleOAuth from '../components/auth/googleOAuth';
import { getIsAuthenticated } from '../selectors/auth';
import { Theme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { NextRouter, useRouter } from 'next/router';
import NextLink from 'next/link';
import { APIError } from '../types/api';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { Dispatch } from 'redux';
import { useDispatch } from "react-redux";
import { reset_auth_failure } from '../reducers/auth';

function Copyright() {
    return (
      <Typography variant="body2" color="textSecondary" align="center">
        {'Copyright © PokeHub '}
        {new Date().getFullYear()}
        {'.'}
      </Typography>
    );
  }

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


const Login = () => {
    const classes = useStyles();
    const [loginEnable, setLoginEnable] = useState<boolean>(false);
    const isAuthenticated: boolean = useSelector<RootState, boolean>(getIsAuthenticated);
    const router: NextRouter = useRouter();
    const dispatch: Dispatch = useDispatch();
    const { handleSubmit, getValues, control, formState: { errors } } = useForm({ mode: 'onChange' });
    const result = useLoginUser(getValues('email'), getValues('password'), loginEnable);
    const error: AxiosError<APIError> = result.error as AxiosError<APIError>;

    const redirectToPrivatePage = () => {
        //Router.push({
        //    pathname: '/login',
        //    query: { from: {router.pathname} },
        //}))
        if (router.query && router.query.from) {
            router.push(router.query.from as string);
        } else {
            router.push('/dashboard');
        }
    }

    const notificationClose = () => {
        dispatch(reset_auth_failure());
    }

    useEffect(() => {
        !isAuthenticated && setLoginEnable(false);
        isAuthenticated && redirectToPrivatePage();
        error && toast.error(error.response?.data.statusCode === 401 ? 'Invalid Credentials' 
                             : error.response?.data.message, { position: toast.POSITION.TOP_CENTER, onClose: notificationClose });
    }, [error, isAuthenticated])

    useEffect(() => {
        setLoginEnable(false);
    }, [])

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
                    <form className={classes.form} onSubmit={handleSubmit((data) => setLoginEnable(true))}>
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
                                <NextLink href='/register'>
                                    <a style={{ textDecoration: 'none' }}>{"Don't have an account? Sign Up" }</a>
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
    )
}

export default Login;