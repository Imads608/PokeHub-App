import { CustomTheme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import Link from "next/link";

const useStyles = makeStyles((theme: CustomTheme) => ({
    root: {
        display: 'flex',
    },
    tab: { 
        border: '1px solid grey',
        width: '40%',
        textAlign: 'center',
        borderRadius: '2px',
        textDecoration: 'none',
        color: theme.palette.secondary.main,
        '&:hover': {
            backgroundColor: theme.palette.primary.light
        }
    },
    selected: {
        backgroundColor: theme.palette.primary.light,
        boxShadow: '0px 1px 1px 1px grey'
    }
}));

interface ChatRoomTabsHeaderProps {
    chatroomId: string,
    selectedTab?: 'Lobby' | 'Rules' | 'Members'
};

const ChatRoomTabsHeader = ({ chatroomId, selectedTab }: ChatRoomTabsHeaderProps) => {
    const classes = useStyles();

    return (
        <div className={classes.root}>
            <Link href={`/chatrooms/${chatroomId}?view=lobby`}>
                <a className={selectedTab && selectedTab === 'Lobby' ? `${classes.tab} ${classes.selected}` : `${classes.tab}`}>Lobby</a>
            </Link>
            <Link href={`/chatrooms/${chatroomId}?view=members`}>
                <a className={selectedTab && selectedTab === 'Members' ? `${classes.tab} ${classes.selected}` : `${classes.tab}`}>Members</a>
            </Link>
            <Link href={`/chatrooms/${chatroomId}?view=rules`}>
                <a className={selectedTab && selectedTab === 'Rules' ? `${classes.tab} ${classes.selected}` : `${classes.tab}`}>Rules</a>
            </Link>
        </div>
    )
}

export default ChatRoomTabsHeader;