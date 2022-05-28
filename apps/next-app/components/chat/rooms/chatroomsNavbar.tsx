import { IChatRoom } from '@pokehub/chat/interfaces';
import makeStyles from '@mui/styles/makeStyles';
import { CustomTheme, List, ListItem, ListItemButton, ListItemText, ListSubheader, Menu } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { open_chatroom, PublicRoomData } from '../../../store/reducers/room';
import { RootState } from '../../../store/store';
import { getCurrentChatRoom, getAllChatRooms } from '../../../store/selectors/room';

const useStyles = makeStyles((theme: CustomTheme) => ({
    root: {
        height: '93vh',
        backgroundColor: theme.palette.primary.main
    },
    subheader: {
        backgroundColor: theme.palette.primary.main
    },
    active: {
        backgroundColor: `${theme.palette.primary.dark} !important`
    }
}));

interface ChatRoomsNavbarProps {
    chatrooms: IChatRoom[];
}

const ChatRoomsNavbar = ({ chatrooms }: ChatRoomsNavbarProps) => {
    const classes = useStyles();
    const router = useRouter();
    const roomIdSelected = router.query.chatrooms && router.query.chatrooms.length > 1 ? router.query.chatrooms[1] : null;
    const openedRoom = useSelector<RootState, PublicRoomData>(getCurrentChatRoom);
    const chatroomsWithState = useSelector<RootState, PublicRoomData[]>(getAllChatRooms);
    const dispatch = useDispatch();

    useEffect(() => {
        if (roomIdSelected && (!openedRoom || openedRoom.id != roomIdSelected)) {
            console.log('ChatRoomsNavbar: Dispatching Open ChatRoom', roomIdSelected, openedRoom);
            dispatch(open_chatroom({ id: roomIdSelected }));
        }
    }, []);

    console.log('ChatRooms Navbar: Room Id Selected: ', roomIdSelected, router.query.chatrooms);

    const openChatRoom = (chatroom: IChatRoom) => {
        const roomToOpen = chatroomsWithState.find((room) => room.id === chatroom.id);
        dispatch(open_chatroom({ id: chatroom.id }));
        router.push(`/chatrooms/${chatroom.id}?view=${roomToOpen.state.currentTab}`, undefined, { shallow: true });
    }

    return (
        <section className={classes.root}>
            <List component='nav' subheader={
                <ListSubheader className={classes.subheader } component="div" id="nested-list-subheader">
                    Chat Rooms
                </ListSubheader>
            }>
                {chatrooms.map((chatroom, index) => (
                    <ListItemButton 
                        key={index} 
                        classes={{ selected: classes.active }} 
                        selected={roomIdSelected != null && roomIdSelected === chatroom.id}
                        onClick={() => openChatRoom(chatroom)}
                    >
                        {chatroom.name.toUpperCase()}
                    </ListItemButton>
                ))}
            </List>
        </section>
    )
}

export default ChatRoomsNavbar;