import React from 'react';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import makeStyles from '@mui/styles/makeStyles';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ChatIcon from '@mui/icons-material/Chat';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
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
      backgroundColor: 'pink',
    },
  },
}));

const Member = ({ username, disable }) => {
  const classes = useStyles();
  return (
    <Paper className={classes.root} elevation={0}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Avatar
          style={{ marginLeft: '10px', marginRight: '10px' }}
          src="/broken-image.jpg"
        />
        <span className="lead">{username}</span>
        <Tooltip title={`Direct Message ${username}`}>
          <React.Fragment>
            <IconButton disabled={disable} color="secondary" size="large">
              <ChatIcon />
            </IconButton>
          </React.Fragment>
        </Tooltip>
        <Tooltip title={`Send Friend Request`}>
          <React.Fragment>
            <IconButton disabled={disable} color="secondary" size="large">
              <PersonAddIcon />
            </IconButton>
          </React.Fragment>
        </Tooltip>
      </div>
    </Paper>
  );
};

export default Member;
