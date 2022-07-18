import { IUserData } from '@pokehub/user/interfaces';
import { AxiosError } from 'axios';
import { useMutation } from 'react-query';
import { useDispatch } from 'react-redux';
import { updateUserProfile } from '../../api/user';
import { user_data_update } from '../../store/reducers/user';

export const useUserProfileMutation = () => {
  const dispatch = useDispatch();
  const mutation = useMutation((profileUpdate: { userId: string, updates: FormData }) =>
      updateUserProfile(profileUpdate.userId, profileUpdate.updates),
    {
      onSuccess: (data: IUserData) => {
        console.log('useSetupUsername: Got successful response from api:', data);
        dispatch(user_data_update(data));
      },
      onError: (err: Error | AxiosError) => {
        console.error('useSetupUsername: Got error', err);
      },
    }
  );

  return mutation;
};
