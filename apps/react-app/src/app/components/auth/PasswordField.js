import { TextField } from "@material-ui/core";
import { useController } from "react-hook-form";

const PasswordField = ({ control }) => {
    const { 
        field: { ref, ...inputProps },
        fieldState: { invalid, isTouched, isDirty, error },
        formState: { touchedFields, dirtyFields }
    } = useController({
        name: 'password',
        control,
        rules: { 
            required: { value: true, message: 'This field is required' },
            minLength: { value: 7, message: 'Password must be at least 7 characters long'},
            pattern: { value: /[0-9a-zA-Z]/, message: 'Password must contain at least one number' }
        }, 
        defaultValue: ""
    });

    return (
        <TextField
            style={{ margin: '10px 0' }}
            {...inputProps}
            inputRef={ref}
            variant='outlined'
            fullWidth
            id='password'
            name='password'
            label='Password'
            autoComplete='password'
            type='password'
            error={!!isTouched && invalid}
            helperText={error && error.message}
        />
    )
}

export default PasswordField;
