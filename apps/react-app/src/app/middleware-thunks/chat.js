import { fetchedChatRooms, openedDM, setDMActive, loadDMConversation, loadChatroomConversation } from '../actions/chat';
import { requestFailure, requestStarted } from '../actions/app';
import { setErrorNotification } from '../actions/notification';
import appConfig from '../config';
import { getAPIRequestHeader, axiosSource } from '../utils';
import { joinedChatRoom, leftChatRoom } from '../actions/user';
import axios from 'axios';
import faker from 'faker';
import { v4 as uuidv4 } from 'uuid';
import { LOAD_CHATROOM_CONVERSATION, LOAD_DM_CONVERSATION, SET_DM_ACTIVE } from '../actions/types/chat';
import { DM_LOAD_ERROR } from '../types/dm';
import { getDM, getDMWithConversation, getChatRooms as getChatRoomsAPI,
         joinChatRoom as joinChatRoomAPI, leaveChatRoom as leaveChatRoomAPI, getConversation } from '../api/chat';

export const getChatRooms = () => async dispatch => {
    try {
        axiosSource.cancel('request was cancelled');
        dispatch(requestStarted());
        let chatrooms = await getChatRoomsAPI();
        chatrooms = chatrooms.map(room => ({ ...room, state: { url: null,  messages: [], isConversationLoaded: false, isActive: false, isOpened: false }}));
        dispatch(fetchedChatRooms(chatrooms));
    } catch (e) {
        console.log(e);
        dispatch(requestFailure(e));
    }
}

export const joinChatRoom = (roomId, uid) => async dispatch => {
    try {
        dispatch(requestStarted());
        const resp = await joinChatRoomAPI(roomId, uid);
        console.log('got response ', resp);
        dispatch(joinedChatRoom(resp));
    } catch (e) {
        console.log(e);
        dispatch(requestFailure(e));
    }  
}

export const leaveChatRoom = (roomId, uid) => async dispatch => {
    try {
        dispatch(requestStarted());
        const resp = await leaveChatRoomAPI(roomId, uid);
        console.log('got response ', resp);
        dispatch(leftChatRoom(resp));
    } catch (e) {
        console.log(e);
        dispatch(requestFailure(e));
    }
}

export const loadDirectMessageConversation = (dmId) => async dispatch => {
    try {
        const conversation = await getConversation(dmId);
        dispatch(loadDMConversation(conversation));
    } catch (err) {
        console.log(err);
        dispatch(setErrorNotification('Unable to load conversation. Please refresh and try again', 'DM', LOAD_DM_CONVERSATION, { id: dmId }));
    }

}

export const loadChatRoomConversation = (roomId) => async dispatch => {
    try {
        const conversation = await getConversation(roomId);
        dispatch(loadChatroomConversation(conversation))
    } catch (err) {
        console.log(err);
        dispatch(setErrorNotification('Unable to load conversation. Please refresh the page and try again', 'ChatRoom', LOAD_CHATROOM_CONVERSATION, { id: roomId }));
    }
}

export const loadUserDM = (participants, browserHistory, isLink, viewType) => async dispatch => {
    //const conversation = { id: null, type: 'private-dm', name: '', isActive: true, recipient, state: { messages: [], opened: true }}
    //console.log('Opening DM', conversation);
    try {
        console.log('Loading UserDM', viewType);
        const dm = await getDM(participants, viewType);
        await dispatch(setDMActive(dm));
        isLink && browserHistory && browserHistory.push(`/dms/${dm.id}`);
    } catch (err) {
        dispatch(setErrorNotification(err.message, viewType === 'LINK' ? 'NewDM_LINK' : 'NewDM_POPPER', SET_DM_ACTIVE));
    }
}

export const loadUserDMWithConversation = (dmId, user) => async dispatch => {
    try {
        const dm = await getDMWithConversation(dmId, user);
        dispatch(setDMActive(dm));
    } catch (err) {
        dispatch(setErrorNotification(DM_LOAD_ERROR, 'AlertNotification', SET_DM_ACTIVE));
    }
}

export const setDMToInactive = (dmId) => async dispatch => {
    
}