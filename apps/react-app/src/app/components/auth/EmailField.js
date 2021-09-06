import { TextField } from "@material-ui/core";
import { useController } from "react-hook-form";

const EmailField = ({ control }) => {
    const {
        field: { ref, ...inputProps },
        fieldState: { invalid, isTouched, isDirty, error},
        formState: { touchedFields, dirtyFields}
    } = useController({
        name: "email", 
        control, 
        rules: { 
            required: { value: true, message: 'This field is required' }, 
            pattern: { value: /.+@.+/, message: 'Please enter a valid email' } 
        }, 
        defaultValue: ""
    });

    return (
        <TextField 
            {...inputProps}
            style={{ margin: '10px 0' }}
            inputRef={ref}
            variant='outlined'
            fullWidth
            id='email'
            name='email'
            label='Email Address'
            autoComplete='email'
            autoFocus
            error={!!isTouched && invalid}
            type='email'
            helperText={error && error.message}
        />
    )
}


export default EmailField;