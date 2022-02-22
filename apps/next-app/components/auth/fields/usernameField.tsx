import { TextField, CustomTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { Control, FieldValues, useController } from 'react-hook-form';
import { UsernameFieldProps } from './props/userFieldProps';
import { makeStyles } from '@mui/styles';
import CircularProgress from '@mui/material/CircularProgress';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';

const useStyles = makeStyles((theme: CustomTheme) => ({
  root: {
    display: 'flex', 
    alignContent: 'center',
    width: '100vh'
  },
  field: {
    width: '41.5%'
  },
  messageSuccess: {
    marginLeft: '5px',
    color: theme.palette.success.main,
    display: 'flex',
    alignSelf: 'center',
  },
  messageError: {
      marginLeft: '5px',
      color: theme.palette.error.main,
      display: 'flex',
      alignSelf: 'center',
  }
}));

const UsernameField = ({ control, controllerProps, availabilityResults }: UsernameFieldProps) => {
  const classes = useStyles();

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
        availabilityResults.isLoading ? <CircularProgress style={{ marginLeft: '10px' }} color='secondary' /> :
        usernameAvailable && !error && value.length > 0 ? (
          <div className={classes.messageSuccess}>
              <DoneIcon />
              <div style={{ marginLeft: '5px' }}>Looks good</div>
          </div>
        ) : availabilityResults.isError && !error ? (
          <div className={classes.messageError}>
              <CloseIcon />
              <span style={{ marginLeft: '5px' }}>Uh Oh. Looks like an error occurred on the server. Please try again later.</span>
          </div>
        ) : !usernameAvailable ? (
          <div className={classes.messageError}>
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
