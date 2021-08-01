import { useDispatch } from 'react-redux';
import { useQuery } from 'react-query';
import { getConversation } from '../api/chat'
import { TYPE_CHAT_DM } from '../types/dm';
import { LOAD_DM_CONVERSATION, LOAD_CHATROOM_CONVERSATION } from '../actions/types/chat';
import { setErrorNotification } from '../actions/notification';
import { loadDMConversation, loadChatroomConversation } from '../actions/chat';

const useConversationLoad = (roomId, typeChat, enable) => {
    const dispatch = useDispatch();

    const mainResourceKey = typeChat === TYPE_CHAT_DM ? 'dms' : 'chatrooms';
    const component = typeChat === TYPE_CHAT_DM ? 'DM' : 'ChatRoom';
    const desiredState = typeChat === TYPE_CHAT_DM ? LOAD_DM_CONVERSATION : LOAD_CHATROOM_CONVERSATION;

    const { data, error, isLoading, isFetching, refetch } = useQuery([mainResourceKey, roomId, 'conversation'], async () => await getConversation(roomId), 
                                               { enabled: enable ? true : false, retry: false, refetchOnWindowFocus: false, refetchOnMount: false, staleTime: Infinity,
                                                 onSuccess: (data) => {
                                                     typeChat === TYPE_CHAT_DM ? data && dispatch(loadDMConversation(data)) : data && dispatch(loadChatroomConversation(data));
                                                 },
                                                 onError: (err) => {
                                                    //dispatch(setErrorNotification('Unable to load conversation. Please refresh and try again', component, desiredState, { id: roomId }));
                                                 }
    });

    return { data, error, isLoading: isLoading || isFetching, refetch };
}

export default useConversationLoad;