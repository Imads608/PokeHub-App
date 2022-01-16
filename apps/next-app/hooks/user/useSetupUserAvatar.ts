import { IUserData } from '@pokehub/user/interfaces';
import { AxiosError } from 'axios';
import { useMutation } from 'react-query';
import { useDispatch } from 'react-redux';
import { setProfileAvatar } from '../../api/user';
import { user_data_update } from '../../store/reducers/user';

export const useSetupUserAvatar = () => {
  const dispatch = useDispatch();
  const mutation = useMutation((data: { uid: string, avatar: FormData }) =>
      setProfileAvatar(data.uid, data.avatar),
    {
      onSuccess: (data: IUserData) => {
        console.log('useSetupUserAvatar: Got successful response from api:', data);
        dispatch(user_data_update(data));
      },
      onError: (err: Error | AxiosError) => {
        console.error('useSetupUserAvatar: Got error', err);
      },
    }
  );

  return mutation;
};
