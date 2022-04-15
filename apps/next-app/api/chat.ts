import { IChatRoom, RoomType } from '@pokehub/chat/interfaces';

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

export const getChatRoomsFake = (): Promise<IChatRoom[]> => {
    const chatrooms: IChatRoom[] = [
        {
            id: '1', name: 'Overused', description: 'Overused Chatroom', roomType: RoomType.CHAT_ROOM
        },
        {
            id: '2', name: 'Underused', description: 'Underused Chatroom', roomType: RoomType.CHAT_ROOM
        }
    ]
  
    return new Promise((resolve, reject) =>
        setTimeout(() => {
            const rand = getRandomInt(10);
            //if (rand < 5) reject({ message: 'Internal Server Error' });
            resolve(chatrooms);
        }, 1000)
    );
}