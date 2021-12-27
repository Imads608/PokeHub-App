import { useDispatch } from 'react-redux';
import { useQuery } from 'react-query';
import { getChatRooms } from '../api/chat';
import { fetchedChatRooms } from '../actions/chat';

const useChatRoomsLoad = (enable) => {
  const dispatch = useDispatch();
  const useQueryResult = useQuery('chatrooms', () => getChatRooms(), {
    enabled: enable ? true : false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
    onSuccess: (data) => {
      if (data) {
        data = data.map((chatroom) => ({
          ...chatroom,
          state: {
            url: null,
            messages: [],
            isConversationLoaded: false,
            isActive: false,
            isOpened: false,
          },
        }));
        dispatch(fetchedChatRooms(data));
      }
    },
    onError: (err) => {
      //dispatch(setErrorNotification(err.message, viewType === 'LINK' ? 'NewDM_LINK' : 'NewDM_POPPER', SET_DM_ACTIVE));
    },
  });

  return useQueryResult;
};

export default useChatRoomsLoad;
