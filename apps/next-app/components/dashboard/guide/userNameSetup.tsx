import { CustomTheme, TextField } from "@mui/material";
import { makeStyles, useTheme } from '@mui/styles'
import { useUsernameAvailability } from '../../../hooks/user/useUsernameAvailability';
import { useEffect, useState } from "react";
import { useController, useForm } from "react-hook-form";
import CircularProgress from '@mui/material/CircularProgress';
import { UserIdTypes } from "@pokehub/user/interfaces";
import { AxiosError } from "axios";
import { APIError } from "../../../types/api";
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';

const useStyles = makeStyles((theme: CustomTheme) => ({
    root: {
      paddingTop: '5px',
      marginLeft: '5px'
    },
    form: {
        display: 'flex',
        alignItems: 'center'
    },
    messageSuccess: {
        marginLeft: '5px',
        color: theme.palette.success.main
    },
    messageError: {
        marginLeft: '5px',
        color: theme.palette.error.main
    }
  }));

interface UserNameSetupProps {
    usernameChosen: (username: string) => void
}

const UserNameSetup = ({ usernameChosen }: UserNameSetupProps) => {
    const classes = useStyles();
    const [verificationTimeout, setVerificationTimeout] = useState<NodeJS.Timeout>(null);
    const [ enableUsernameCheck, setEnableUsernameCheck ] = useState<boolean>(false);
    const { handleSubmit, getValues, control, formState: { errors } } = useForm({ mode: 'onChange' });
    const result = useUsernameAvailability(getValues('username'), enableUsernameCheck);
    const usernameAvailable = result.isLoading || !result.isFetched ? true : result.data;

    const { field: { ref, ...inputProps }, fieldState: { invalid, isTouched, isDirty, error }, formState: { touchedFields, dirtyFields }, } = useController({
        name: 'username',
        control,
        rules: {
          required: { value: true, message: 'This field is required' },
          minLength: {
            value: 5,
            message: 'Username should be at least 5 characters',
          },
          validate: {
            isAvailable: async (username) => {
                return new Promise((resolve, reject) => {
                    verificationTimeout && clearTimeout(verificationTimeout);
                    setVerificationTimeout(setTimeout(() => {
                        console.log('Validation', username);
                    }, 400));
                    setEnableUsernameCheck(true);
                    resolve(true);//resolve("This is already teaken");
                })
            },
          }
        },
        defaultValue: '',
    });

    useEffect(() => {
        if (result.isLoading || !usernameAvailable || error)
            usernameChosen(null);
        else if (!result.isLoading && usernameChosen && !error && getValues('username').length > 0)
            usernameChosen(getValues('username'));
    }, [result.isLoading, error, usernameAvailable])

    useEffect(() => {
        setEnableUsernameCheck(false);
    }, [result.isLoading])

    return (
        <div className={classes.root}>
            <div style={{ marginBottom: '10px' }}>
                Please Choose a Username
            </div>
            <form className={classes.form}>
                <TextField
                    {...inputProps}
                    inputRef={ref}
                    variant="outlined"
                    id="username"
                    name="username"
                    label="Username"
                    autoComplete="username"
                    error={!!isTouched && (invalid || !usernameAvailable)}
                    helperText={!usernameAvailable ? 'This username is already taken' : error && error.message}
                    autoFocus
                    style={{ width: '30%' }}
                />
                {result.isLoading ? <CircularProgress style={{ marginLeft: '10px' }} color='secondary' /> : 
                 usernameAvailable && !error && getValues('username').length > 0 ? (
                    <div className={classes.messageSuccess}>
                        <DoneIcon />
                        <span style={{ marginLeft: '5px' }}>Looks good</span>
                    </div>
                ) : result.isError && !error ? (
                    <div className={classes.messageError}>
                        <CloseIcon />
                        <span style={{ marginLeft: '5px' }}>Uh Oh. Looks like an error occurred on the server. Please try again later.</span>
                    </div>
                ) : ''}
            </form>
        </div>
    )
}

export default UserNameSetup;