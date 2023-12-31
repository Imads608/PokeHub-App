import { CustomTheme } from "@mui/material";
import { makeStyles } from '@mui/styles'
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import UsernameField from "../../auth/fields/username-field/username-field.component";

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

const UserNameSetup = ({ usernameChosen }: UserNameSetupProps) => {
    const classes = useStyles();
    const { control } = useForm({ mode: 'onChange' });

    return (
        <div className={classes.root}>
            <div style={{ marginBottom: '10px' }}>
                Change Username (Optional)
            </div>
            <form className={classes.form}>
                <UsernameField required={false} control={control} currentValListener={usernameChosen} />
            </form>
        </div>
    )
}

export default UserNameSetup;