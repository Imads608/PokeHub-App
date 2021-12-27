import { Avatar, Box, Button, Container, CssBaseline, Grid, TextField, Typography } from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import { LockOutlined as LockOutlinedIcon } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { useSignupUser } from "../../hooks/auth/useSignupUser";
import EmailField from "../../components/auth/emailField";
import GoogleOAuth from "../../components/auth/googleOAuth";
import PasswordField from "../../components/auth/passwordField";
import UsernameField from "../../components/auth/usernameField";
import { connect, useSelector } from 'react-redux';
import { getIsAuthenticated } from "../../store/selectors/auth";
import { useEffect } from "react";
import { Theme } from '@mui/material/styles';
import { NextRouter, useRouter } from "next/router";
import { RootState } from "../../store/store";
import NextLink from 'next/link';

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


const Register = () => {
    const classes = useStyles();
    const mutation = useSignupUser();
    const isAuthenticated: boolean = useSelector<RootState, boolean>(getIsAuthenticated);
    const router: NextRouter = useRouter();

    const { handleSubmit, getValues, control, formState: { errors } } = useForm({ mode: 'onChange' });

    const redirectToPrivatePage = () => {
        router.push('/dashboard');
    }

    useEffect(() => {
        isAuthenticated && redirectToPrivatePage();
    }, [isAuthenticated])

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
                <form className={classes.form} onSubmit={handleSubmit((data) => mutation.mutate({ email: data.email, username: data.username, password: data.password }))}>
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
                        <NextLink href='/register'>
                                    <a style={{ textDecoration: 'none' }}>{"Already have an account? Sign In" }</a>
                        </NextLink>
                        </Grid>
                    </Grid>
                </form>
            </div>
            <Box mt={5}>
                <Copyright />
            </Box>
            </Container>
    )
}

export default Register;