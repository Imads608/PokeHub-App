import { IUserData } from '@pokehub/user';
import { NextRouter, useRouter } from 'next/router';
import { getUser } from '../../store/selectors/user';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useEffect } from 'react';

const UserActivation = () => {
  const router: NextRouter = useRouter();
  const user: IUserData = useSelector<RootState, IUserData>(getUser);

  useEffect(() => {
    user.emailVerified && router.push('/');
  }, [user]);

  return <div>Your account has been activated.</div>;
};

export default UserActivation;
