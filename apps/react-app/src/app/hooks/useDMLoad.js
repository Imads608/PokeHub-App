import { useDispatch } from 'react-redux';
import { setDMActive } from '../actions/chat';
import { useQuery } from 'react-query';
import { getDMFromID, getDM } from '../api/chat'
import { setErrorNotification } from '../actions/notification';
import { SET_DM_ACTIVE } from '../actions/types/chat';

export const useDMLoad = (dmId, publicUser, viewType, enable) => {
    const dispatch = useDispatch();
    const useQueryResult = useQuery(['dms', dmId], () => getDMFromID(dmId, publicUser, viewType), 
                                               { enabled: enable ? true : false, refetchOnWindowFocus: false, refetchOnMount: false, staleTime: Infinity,
                                                 onSuccess: (data) => data && dispatch(setDMActive(data)),
                                                 onError: (err) => {
                                                    //dispatch(setErrorNotification(err.message, viewType === 'LINK' ? 'NewDM_LINK' : 'NewDM_POPPER', SET_DM_ACTIVE));
                                                 }
    });

    return useQueryResult;
}

export const useDMLoadFromParticipants = (participants, viewType, enable) => {
    const dispatch = useDispatch();
    const dmKey = participants && participants.length > 0 ? participants[0].username + "-" + participants[1].username : 'participants';
    const useQueryResult = useQuery(['dms', dmKey], () => getDM(participants, viewType), 
                                               { enabled: enable ? true : false, refetchOnWindowFocus: false, refetchOnMount: false, staleTime: Infinity, retry: false,
                                                 onSuccess: (data) => data && dispatch(setDMActive(data)),
                                                 onError: (err) => {
                                                    //dispatch(setErrorNotification(err.message, viewType === 'LINK' ? 'NewDM_LINK' : 'NewDM_POPPER', SET_DM_ACTIVE));
                                                 }
    });

    return useQueryResult;
}