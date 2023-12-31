import { Avatar, Box, Container, Typography, Button, PaletteMode } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Theme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { toast } from 'react-toastify';
import { getPaletteTheme } from '../../../store/app/app.selector';
import { useSendPasswordReset } from '../../../hooks/auth/send-password-reset.hook';
import Copyright from '../../../components/common/copyright.component';
import { usePageStyles } from 'apps/next-app/hooks/styles/common/page.styles';
import { makeStyles } from 'tss-react/mui';
import EmailField from 'apps/next-app/components/auth/fields/email-field/email-field.component';
import PageLayout from 'apps/next-app/components/common/page-layout/page-layout.component';

const useStyles = makeStyles()((theme: Theme) => ({
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

const PasswordReset = () => {
    const { classes: pageClasses } = usePageStyles();
    const {classes} = useStyles();
    const { handleSubmit, getValues, control, formState: { errors } } = useForm({ mode: 'onChange' });
    const mutation = useSendPasswordReset();
    const mode: PaletteMode = useSelector<RootState, PaletteMode>(getPaletteTheme);

    const successNotification = () => {
        toast.success("A Password Reset Link has been sent to the provided Email.",
        {
          position: toast.POSITION.TOP_CENTER,
          theme: mode,
          style: { maxWidth: '80vh', width: '150%', left: -80, position: 'absolute', justifySelf: 'start', alignSelf: 'center' }
        });
    }

    const failureNotification = () => {
        toast.error('Uh Oh. Looks like something went wrong. Please try again later',
        {
          position: toast.POSITION.TOP_CENTER,
          theme: mode,
          style: { maxWidth: '80vh', width: '150%', left: -80, position: 'absolute', justifySelf: 'start', alignSelf: 'center' }
        });
    }

    useEffect(() => {
        console.log('PasswordReset useEffect here: ', mutation.isSuccess, mutation.isLoading);
        mutation.isSuccess && !mutation.isLoading && successNotification();
        mutation.isError && !mutation.isLoading && failureNotification();
    }, [mutation.isSuccess, mutation.isLoading]);

    return (
        <PageLayout>
            <div className={pageClasses.root}>
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
                            onSubmit={handleSubmit((data) => mutation.mutate(data.email))}
                        >
                            <EmailField control={control} />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="primary"
                                disabled={mutation.isLoading}
                                className={classes.submit}
                            >
                                Send Password Reset Email
                            </Button>
                        </form>
                    </div>
                    <Box mt={8}>
                        <Copyright />
                    </Box>
                </Container>
            </div>
        </PageLayout>
    )
}


export default PasswordReset;