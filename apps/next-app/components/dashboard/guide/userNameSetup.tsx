import { TextField } from "@mui/material";
import { useUsernameAvailability } from '../../../hooks/auth/useUsernameAvailability';
import { useState } from "react";
import { useController, useForm } from "react-hook-form";
import CircularProgress from '@mui/material/CircularProgress';
import { UserIdTypes } from "@pokehub/user";

const UserNameSetup = () => {
    const [usernameVerification, setUsernameVerification] = useState<NodeJS.Timeout>(null);
    const [ enableUsernameCheck, setEnableUsernameCheck ] = useState<boolean>(false);
    const { handleSubmit, getValues, control, formState: { errors } } = useForm({ mode: 'onChange' });
    //const result = useUsernameAvailability(getValues('username'), enableUsernameCheck);
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
                    usernameVerification && clearTimeout(usernameVerification);
                    setUsernameVerification(setTimeout(() => {
                        console.log('Validation', username);
                    }, 400));
                    resolve(true);//resolve("This is already teaken");
                })
            },
          }
        },
        defaultValue: '',
    });

    return (
        <div style={{ paddingTop: '5px', marginLeft: '5px' }}>
            <div style={{ marginBottom: '10px' }}>
                Please Choose a Username
            </div>
            <form>
                <TextField
                    {...inputProps}
                    inputRef={ref}
                    variant="outlined"
                    id="username"
                    name="username"
                    label="Username"
                    autoComplete="username"
                    error={!!isTouched && invalid}
                    helperText={error && error.message}
                    autoFocus
                    style={{ width: '30%' }}
                />
                <CircularProgress color='secondary' />
            </form>
        </div>
    )
}

export default UserNameSetup;