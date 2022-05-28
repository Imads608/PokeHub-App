import { TextField } from '@mui/material';
import { useController } from 'react-hook-form';
import { EmailFieldProps } from './props/emailFieldProps';
import CircularProgress from '@mui/material/CircularProgress';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import { useFieldStyles } from './styles/useFieldStyles';


const EmailField = ({ control, controllerProps, availabilityResults }: EmailFieldProps) => {
  const classes = useFieldStyles();

  const defaultControllerProps = {
    name: 'email', 
    control, 
    rules: {
      required: { value: true, message: 'This field is required' },
      pattern: { value: /.+@.+/, message: 'Please enter a valid email' },
    }, defaultValue: ''
  }

  const {
    field: { ref, value, ...inputProps },
    fieldState: { invalid, isTouched, isDirty, error },
    formState: { touchedFields, dirtyFields },
  } = useController(controllerProps ? controllerProps : defaultControllerProps);

  const emailAvailable = !availabilityResults ? true : availabilityResults.isLoading || !availabilityResults.isFetched ? true : availabilityResults.data

  console.log('EmailField: ', value, availabilityResults, emailAvailable);

  return (
    <div className={classes.root}>
      <TextField
        {...inputProps}
        className={classes.field}
        style={{ margin: '10px 0' }}
        inputRef={ref}
        variant="outlined"
        fullWidth
        id="email"
        name="email"
        label="Email Address"
        autoComplete="email"
        autoFocus
        error={!!isTouched && invalid}
        type="email"
        helperText={error && error.message}
        color="secondary"
      />
      { availabilityResults ? (
        availabilityResults.isLoading ? 
        <div className={`${classes.message}`}>
          <CircularProgress color='secondary' />
        </div> :
        emailAvailable && !error && value.length > 0 ? (
          <div className={`${classes.message} ${classes.messageSuccess}`}>
              <DoneIcon />
              <div style={{ marginLeft: '5px' }}>Looks good</div>
          </div>
        ) : availabilityResults.isError && !error ? (
          <div className={`${classes.message} ${classes.messageError}`}>
              <CloseIcon />
              <span style={{ marginLeft: '5px' }}>Uh Oh. Looks like an error occurred on the server. Please try again later.</span>
          </div>
        ) : !emailAvailable ? (
          <div className={`${classes.message} ${classes.messageError}`}>
              <CloseIcon />
              <span style={{ marginLeft: '5px' }}>That email is taken</span>
          </div>
        ) : ''
      ) : ''
      }
    </div>
  );
};

export default EmailField;
