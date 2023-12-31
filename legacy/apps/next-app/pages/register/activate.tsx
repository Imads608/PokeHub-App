import { IUserProfileWithToken } from '@pokehub/user/interfaces';
import { NextRouter, useRouter } from 'next/router';
import { useEmailActivation } from '../../hooks/auth/email-activation.hook';
import { UseQueryResult } from 'react-query';
import { APIError } from '../../types/api';
import CircularProgress from '@mui/material/CircularProgress';
import { AxiosError } from 'axios';
import FailureAuthNotification from '../../components/auth/notifications/failure-auth-notification.component';
import SuccessAuthNotification from '../../components/auth/notifications/success-auth-notification.component';
import { usePageStyles } from 'apps/next-app/hooks/styles/common/page.styles';
import PageLayout from 'apps/next-app/components/common/page-layout/page-layout.component';

const UserActivation = () => {
    const router: NextRouter = useRouter();
    const { classes } = usePageStyles({ justifyContent: 'center', alignItems: 'center' });
    const activationToken = router.query['activation_token'] as string === 'undefined' ? null : router.query['activation_token'] as string;
    const result: UseQueryResult<IUserProfileWithToken, Error | APIError> = useEmailActivation(activationToken);
    const error = result.error as AxiosError<APIError>;

    return (
        <PageLayout>
            <main className={classes.root}>
                { !result.isLoading && !result.isSuccess ? (
                    <FailureAuthNotification failureText={error.response ? error.response.data.message : ''} />
                ) : result.isLoading ? (
                    <CircularProgress />
                ) : (
                    <SuccessAuthNotification successText='Success! Your Account has been validated. Please Login' />
                )}
            </main>
        </PageLayout>
    )
};

export default UserActivation;
