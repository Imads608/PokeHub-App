import { CustomTheme, List, ListItem, ListItemButton, ListItemText, ListSubheader, Menu } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { ChatRoomTabs } from "../../../../types/chatroom";
import Link from "next/link";
import { useRouter } from "next/router";
import { useDispatch } from 'react-redux';
import { change_chatroom_tab } from '../../../../store/reducers/room';

const useStyles = makeStyles((theme: CustomTheme) => ({
    root: {
        display: 'flex',
        paddingTop: 0
    },
    tab: { 
        borderRadius: '2px',
        color: theme.palette.secondary.main,
    },
    text: {
        textAlign: 'center',
        width: '100%'
    },
    selected: {
        backgroundColor: theme.palette.primary.light,
        boxShadow: '0px 1px 1px 1px grey'
    }
}));

interface ChatRoomTabsHeaderProps {
    chatroomId: string,
    selectedTab?: ChatRoomTabs
};

const ChatRoomTabsHeader = ({ chatroomId, selectedTab }: ChatRoomTabsHeaderProps) => {
    const classes = useStyles();

    const router = useRouter();
    const dispatch = useDispatch();

    const openRoomTab = (tabId: ChatRoomTabs) => {
        dispatch(change_chatroom_tab({ tab: tabId, id: chatroomId }));
        router.push({ pathname: `/chatrooms/${chatroomId}`, query: { view: `${tabId.toLowerCase()}` } }, undefined, { shallow: true });
    }

    console.log('ChatRoomTabsHeader: ', chatroomId, selectedTab);

    return (
        <List component='nav' className={classes.root}>
            <ListItemButton 
                selected={selectedTab == 'Lobby'}
                className={classes.tab}
                onClick={() => openRoomTab('Lobby')}
            >
                <span className={classes.text}>Lobby</span>
            </ListItemButton>
            <ListItemButton
                selected={selectedTab === 'Rules'}
                className={classes.tab}
                onClick={() => openRoomTab('Rules')}
            >
                <span className={classes.text}>Rules</span>
            </ListItemButton>
            <ListItemButton
                selected={selectedTab === 'Members'}
                className={classes.tab}
                onClick={() => openRoomTab('Members')}
            >
                <span className={classes.text}>Members</span>
            </ListItemButton>
            
        </List>
    )
}

export default ChatRoomTabsHeader;