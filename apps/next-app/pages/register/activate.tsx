import { IUserProfileWithToken } from '@pokehub/user/interfaces';
import { NextRouter, useRouter } from 'next/router';
import { useEmailActivation } from '../../hooks/auth/useEmailActivation';
import { UseQueryResult } from 'react-query';
import { APIError } from '../../types/api';
import CircularProgress from '@mui/material/CircularProgress';
import { AxiosError } from 'axios';
import styles from '../../styles/activate.module.scss';
import FailureAuthNotification from '../../components/auth/notifications/failureAuthNotification';
import SuccessAuthNotification from '../../components/auth/notifications/successAuthNotification';

const UserActivation = () => {
    const router: NextRouter = useRouter();
    const activationToken = router.query['activation_token'] as string === 'undefined' ? null : router.query['activation_token'] as string;
    const result: UseQueryResult<IUserProfileWithToken, Error | APIError> = useEmailActivation(activationToken);
    const error = result.error as AxiosError<APIError>;

    return (
        <main className={styles['main-window']}>
            { !result.isLoading && !result.isSuccess ? (
                <FailureAuthNotification failureText={error.response ? error.response.data.message : ''} />
            ) : result.isLoading ? (
                <CircularProgress />
            ) : (
                <SuccessAuthNotification successText='Success! Your Account has been validated. Please Login' />
            )}
        </main>
    )
};

export default UserActivation;
