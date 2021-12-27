import { useSendAccountActivation } from '../../hooks/auth/useSendAccountActivation';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { getUser } from '../../store/selectors/user';
import { IUserData } from '@pokehub/user';
import { Alert, Button, Collapse } from '@mui/material';
import { IJwtTokenBody } from '@pokehub/auth';
import { useState, useEffect } from 'react';
import { Box } from '@mui/system';

const EmailVerificationNotification: () => JSX.Element = () => {
    const mutation = useSendAccountActivation();
    const user: IUserData = useSelector<RootState, IUserData>(getUser);
    const [open, setOpen] = useState<boolean>(false);

    useEffect(() => {
        user && !user.emailVerified && setOpen(true);
    }, [user]);

    return (
        <Box style={{ marginLeft: '25%', marginTop: '10px', display: 'flex', justifySelf: 'center' }} sx={{ width: '75%' }}>
            <Collapse in={open}>
                <Alert action={
                    <>
                    <Button disabled={mutation.isLoading} onClick={() => mutation.mutate(user as IJwtTokenBody)}>
                        Resend
                    </Button>
                    <Button onClick={() => setOpen(false)}>
                        Close
                    </Button>
                    </>
                }>
                    We have sent an Email to the Provided Email Id to Activate Your Account.
                </Alert>
            </Collapse>
        </Box>
    )

}

export default EmailVerificationNotification;