import { CustomTheme } from "@mui/material";
import { makeStyles } from '@mui/styles'
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { withUsernameAvailableField } from "../../../hoc/auth/fields/withUsernameAvailableField";
import UsernameField from "../../auth/fields/usernameField";

const useStyles = makeStyles((theme: CustomTheme) => ({
    root: {
      paddingTop: '5px',
      marginLeft: '5px',
      marginBottom: '10px'
    },
    form: {
        display: 'flex',
        alignItems: 'center'
    }
  }));

interface UserNameSetupProps {
    usernameChosen: (username: string) => void
}

const UsernameFieldAvailabilityWrapper = withUsernameAvailableField(UsernameField);

const UserNameSetup = ({ usernameChosen }: UserNameSetupProps) => {
    const classes = useStyles();
    const { control } = useForm({ mode: 'onChange' });

    return (
        <div className={classes.root}>
            <div style={{ marginBottom: '10px' }}>
                Change Username (Optional)
            </div>
            <form className={classes.form}>
                <UsernameFieldAvailabilityWrapper required={false} control={control} currentValListener={usernameChosen} />
            </form>
        </div>
    )
}

export default UserNameSetup;