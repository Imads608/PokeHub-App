import { Avatar, Box, Container, Typography, Button, PaletteMode, CircularProgress, } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { LockOutlined } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import PasswordField from '../../../components/auth/fields/passwordField';
import { Theme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { toast } from 'react-toastify';
import { getAppTheme } from '../../../store/selectors/app';
import { useSendPasswordReset } from '../../../hooks/auth/useSendPasswordReset';
import Copyright from '../../../components/common/copyright';
import { usePasswordReset } from '../../../hooks/auth/usePasswordReset';
import { NextRouter, useRouter } from 'next/router';
import useValidateToken from '../../../hooks/auth/useValidateToken';
import { TokenTypes } from '@pokehub/auth/interfaces';
import SentimentVeryDissatisfied from '@mui/icons-material/SentimentVeryDissatisfied';
import Link from 'next/link';
import styles from '../../../styles/password-reset-edit.module.scss';
import SuccessAuthNotification from '../../../components/auth/notifications/successAuthNotification';
import FailureAuthNotification from '../../../components/auth/notifications/failureAuthNotification';
import { GetServerSideProps, GetStaticProps, InferGetServerSidePropsType } from 'next';
import { AxiosError } from 'axios';
import { APIError } from '../../../types/api';

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

export const getServerSideProps: GetServerSideProps = async (context) => {
    const token: string = context.query['password_reset_token'] as string;
    return {
        props: {
            passwordResetToken: token ? token : null
        }
    }
}

const NewPassword = ({ passwordResetToken }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
    const classes = useStyles();
    const mutation = usePasswordReset();
    const [ enableValidation, setEnableValidation ] = useState<boolean>(true);
    const theme: PaletteMode = useSelector<RootState, PaletteMode>(getAppTheme);
    const validationResult = useValidateToken(passwordResetToken, TokenTypes.PASSWORD_RESET_TOKEN, enableValidation);
    const { handleSubmit, getValues, control, formState: { errors } } = useForm({ mode: 'onChange' });
    const mutationError: AxiosError<APIError> = mutation.error as AxiosError<APIError>;
    const notifyError = (message) => {
        toast.error(message,
        {
          position: toast.POSITION.TOP_CENTER,
          theme,
          style: { maxWidth: '80vh', width: '150%', left: -80, position: 'absolute', justifySelf: 'start', alignSelf: 'center' }
        });
    }

    useEffect(() => {
        validationResult.isFetched && setEnableValidation(false);
    }, [validationResult.isFetched])

    return (
        <div className={(validationResult.isLoading || mutation.isLoading) || !validationResult.data || mutation.isSuccess || mutation.isError ? 
                        styles['main-window'] : ''}>
            { validationResult.isLoading || mutation.isLoading? (
                <CircularProgress /> 
            ) : mutation.isSuccess ? (
                <SuccessAuthNotification successText='Your password has been reset!' />
            ) : !validationResult.data ? (
                <FailureAuthNotification failureText='You do not have a valid token to reset your password' />
            ) : mutation.isError ? (
                <FailureAuthNotification failureText={mutationError.response.data.statusCode === 401 ? 'The Token has expired.' : 'An Error occurred on the server. Please try again later'} />
            ): (
                <Container component="main" maxWidth="xs">
                <div className={classes.paper}>
                    <Avatar className={classes.avatar}>
                        <LockOutlined />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Password Reset
                    </Typography>
                    <form
                        className={classes.form}
                        onSubmit={handleSubmit((data) => data.password != data.password_reentered ? notifyError('Passwords do not match') : 
                                  mutation.mutate({ resetToken: passwordResetToken, newPassword: data.password }))}
                    >
                        <PasswordField control={control} name='password' id='password' label='New Password' />
                        <PasswordField control={control} name='password_reentered' id='password_reentered' label='Re-enter New Password' />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            disabled={mutation.isLoading}
                            className={classes.submit}
                        >
                            Update Password
                        </Button>
                    </form>
                </div>
                <Box mt={8}>
                    <Copyright />
                </Box>
            </Container>
            )}
        </div>
    )
}

export default NewPassword