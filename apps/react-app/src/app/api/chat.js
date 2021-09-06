import axios from 'axios';
import faker from 'faker';
import { v4 as uuidv4 } from 'uuid';
import { getAPIRequestHeader } from '../utils';
import appConfig from '../config';

let membersSeed = [];
for(var i=0; i<500; i++)
    membersSeed.push({ username: faker.fake("{{name.lastName}}, {{name.firstName}} {{name.suffix}}"), uid: uuidv4() });

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

export const getDM = (participants, viewType) => new Promise((resolve, reject) => (
    setTimeout(() => {
        const result = { id: uuidv4(), type: 'private-dm', name: '', isActive: true, participants, state: { messages: [], unread: 0, isConversationLoaded: false, isOpened: false, viewType }}
        const rand = getRandomInt(10);
        if (rand < 5) reject({ message: 'Unable to create DM' });
        resolve(result);
    }, 1000)
))

export const getConversation = (id) => new Promise((resolve, reject) => (
    setTimeout(() => {
        const result = { id, messages: [] }
        const rand = getRandomInt(10);
        if (rand < 8) reject({ message: 'Unable to create conversation' })
        resolve(result);
    }, 1000)
))

export const getDMFromID = (dmId, user, viewType) => new Promise((resolve, reject) => (
    setTimeout(() => {
        const result = { id: uuidv4(), type: 'private-dm', name: '', isActive: true, participants: [user, membersSeed[0]], state: { messages: [], unread: 0, isConversationLoaded: false, isOpened: false, viewType }}
        const rand = getRandomInt(10);
        if (rand < 5) reject({ message: 'Unable to create DM' });
        resolve(result);
    }, 1000)
))

export const getDMWithConversation = (id, user, viewType = 'NewDM_POPPER' ) => new Promise((resolve, reject) => (
    setTimeout(() => {
        const result = { id, type: 'private-dm', name: '', isActive: true, participants: [user, membersSeed[0]], state: { messages: [], unread: 0, isConversationLoaded: true, isOpened: false, viewType }}
        const rand = getRandomInt(10);
        if (rand < 5) reject({ message: 'Unable to get DM details' });
        
        resolve(result);
    }, 1000)
));


export const getChatRoomMembers = (offset, limit, search) => new Promise((resolve, reject) => (
    setTimeout(() => {
        console.log('Search', search);
        let members = membersSeed;
        if (search) {
            members = membersSeed.filter(member => member.username.includes(search));
        }
        const result = members.slice(offset, offset+limit)
        console.log('Result', result);
        if (offset + limit >= members.length) resolve({ data: result, isDone: true });
        else resolve({ data: result, isDone: false })
    }, 1000)
));

export const getChatRooms = async () => {
    const chatrooms = await axios.get(`${appConfig.apiGateway}/chat/public-rooms`);
    return chatrooms.data;
}

export const joinChatRoom = async (roomId, uid) => {
    const body = JSON.stringify({ uid });
    const resp = await axios.post(`${appConfig.apiGateway}/chatrooms/${roomId}/members`, body, getAPIRequestHeader());
    return resp.data;
}

export const leaveChatRoom = async (roomId, uid) => {
    const resp = await axios.delete(`${appConfig.apiGateway}/chatrooms/${roomId}/members/${uid}`, getAPIRequestHeader());
    return resp.data;
}


