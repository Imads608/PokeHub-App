import { TextField } from '@mui/material';
import { useController } from 'react-hook-form';
import { UsernameFieldProps } from './props/userFieldProps';
import CircularProgress from '@mui/material/CircularProgress';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import { useFieldStyles } from '../../../hooks/styles/auth/useFieldStyles';
import { useEffect } from 'react';

const UsernameField = ({ control, controllerProps, availabilityResults, currentValListener }: UsernameFieldProps) => {
  const {classes} = useFieldStyles();

  const defaultControllerProps = {
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
  }

  const {
    field: { ref, value, ...inputProps },
    fieldState: { invalid, isTouched, isDirty, error },
    formState: { touchedFields, dirtyFields },
  } = useController(controllerProps ? controllerProps : defaultControllerProps);

  const usernameAvailable = !availabilityResults ? true : availabilityResults.isLoading || !availabilityResults.isFetched ? true : availabilityResults.data

  useEffect(() => {
    currentValListener && currentValListener(usernameAvailable && !error && !availabilityResults.error ? value : null);
  }, [usernameAvailable, currentValListener, availabilityResults.error, value, error]);

  return (
    <div className={classes.root}>
      <TextField
        {...inputProps}
        className={classes.field}
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
      { availabilityResults ? (
        availabilityResults.isLoading ? 
        <div className={`${classes.message}`}>
          <CircularProgress color='secondary' />
        </div>  :
        usernameAvailable && !error && value.length > 0 ? (
          <div className={`${classes.message} ${classes.messageSuccess}`}>
              <DoneIcon />
              <div style={{ marginLeft: '5px' }}>Looks good</div>
          </div>
        ) : availabilityResults.isError && !error ? (
          <div className={`${classes.message} ${classes.messageError}`}>
              <CloseIcon />
              <span style={{ marginLeft: '5px' }}>Uh Oh. Looks like an error occurred on the server. Please try again later.</span>
          </div>
        ) : !usernameAvailable ? (
          <div className={`${classes.message} ${classes.messageError}`}>
              <CloseIcon />
              <span style={{ marginLeft: '5px' }}>That username is taken</span>
          </div>
        ) : ''
      ) : ''
      }
    </div>
  );
};

export default UsernameField;
