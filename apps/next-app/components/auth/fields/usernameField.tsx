import { TextField } from '@mui/material';
import { useState } from 'react';
import { Control, FieldValues, useController } from 'react-hook-form';

interface UsernameFieldProps {
  control: Control<FieldValues>;
}

const UsernameField = ({ control }: UsernameFieldProps) => {
  const [typingTimeout, setTypingTimeout] = useState(0);

  const {
    field: { ref, ...inputProps },
    fieldState: { invalid, isTouched, isDirty, error },
    formState: { touchedFields, dirtyFields },
  } = useController({
    name: 'username',
    control,
    rules: {
      required: { value: true, message: 'This field is required' },
      minLength: {
        value: 5,
        message: 'Username should be at least 5 characters',
      },
      //validate: async (username) => console.log(await isUsernameAvailable(username))
    },
    defaultValue: '',
  });

  /*
    const isUsernameAvailable = (chosenUsername) => {
        if (typingTimeout)
            clearTimeout(typingTimeout);
        setTypingTimeout(setTimeout(() => {
            return true;
        }, 500))
    }*/

  return (
    <TextField
      {...inputProps}
      inputRef={ref}
      variant="outlined"
      fullWidth
      id="username"
      name="username"
      label="Username"
      autoComplete="username"
      error={!!isTouched && invalid}
      helperText={error && error.message}
    />
  );
};

export default UsernameField;
