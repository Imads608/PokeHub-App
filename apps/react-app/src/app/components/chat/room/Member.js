import React from 'react';
import Paper from '@material-ui/core/Paper';
import Avatar from '@material-ui/core/Avatar';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import ChatIcon from '@material-ui/icons/Chat';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import '../chat.css';

const useStyles = makeStyles(() => ({
    root: {
        backgroundColor: 'rgb(245, 212, 212)',
        width: '50%',
        marginLeft: '20px',
        marginTop: '5px',
        paddingTop: '10px',
        paddingBottom: '10px',
        borderRadius: '5px',
        '&:hover': {
            backgroundColor: 'pink'
        }
    }
}));

const Member = ({ username, disable }) => {
    const classes = useStyles();
    return (
        <Paper 
            className={classes.root}
            elevation={0}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar style={{ marginLeft: '10px', marginRight: '10px' }} src='/broken-image.jpg' />
                <span className='lead'>{username}</span>
                <Tooltip title={`Direct Message ${username}`}>
                    <React.Fragment>
                        <IconButton disabled={disable} color='secondary' >
                            <ChatIcon />
                        </IconButton>
                    </React.Fragment>
                </Tooltip>
                <Tooltip title={`Send Friend Request`}>
                    <React.Fragment>
                        <IconButton disabled={disable} color='secondary' >
                            <PersonAddIcon />
                        </IconButton>
                    </React.Fragment>
                </Tooltip>
            </div>
        </Paper>
    )
}

export default Member;