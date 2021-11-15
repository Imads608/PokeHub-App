import React, { useEffect, useState } from 'react';
import { Paper, Avatar, Divider, IconButton } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import '../../drawer.css';
import ChatWindow from '../../../common/ChatWindow';
import ChatInput from '../../../common/ChatInput';
import { connect } from 'react-redux';
import { sentDM, closedDM } from '../../../../actions/chat';
import { resetNotification } from '../../../../actions/notification';
import { loadDirectMessageConversation } from '../../../../middleware-thunks/chat';
import { getOpenedDMRecipients } from '../../../../selectors/chat';
import { getAppNotification } from '../../../../selectors/notification';
import { getDrawerToggle } from '../../../../selectors/drawer';
import PropTypes from 'prop-types';
import { DMPropTypes, VIEW_TYPE_LINK, TYPE_CHAT_DM, VIEW_TYPE_POPPER } from '../../../../types/dm';
import { PublicUserPropTypes } from '../../../../types/user';
import { AppNotificationPropTypes, ERROR } from '../../../../types/notification';
import WithConversation from '../../../hoc/WithConversation';
import { useLocation, Redirect } from 'react-router-dom';
import { LOAD_DM_CONVERSATION } from '../../../../actions/types/chat';

const useStyles = makeStyles((theme) => ({
      search: {

        transform: '(597px 122px, 0px)',
        height: '60vh',
        width: '60vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgb(255, 219, 223)'
      },
      input: {
        marginLeft: theme.spacing(1),
        flex: 1,
      }
  }));

const DM = ({ recipients, currentDM, sentDM, closedDM, drawerToggle, error, loading, reloadConversation}) => {
    const classes = useStyles();
    const location = useLocation();

    useEffect(() => {
      !drawerToggle && currentDM && closedDM(currentDM.id);
    }, [drawerToggle]);

    /*const reloadConversation = () => {
      notification.type === ERROR && notification.component === 'DM' && resetNotification();
      loadDirectMessageConversation(currentDM.id);
    }*/

    return currentDM.state.viewType === VIEW_TYPE_LINK ? '' : 
    (
      <Paper className={classes.search} elevation={4}>
        <section className='dm-header'>
          <div className='dm-header-left-group'>
            <Avatar style={{ marginRight: '10px' }} src='/broken-image.jpg' />
            <span className='lead'>{recipients[0].username}</span>
          </div>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="end"
            onClick={() => closedDM(currentDM.id)}
            size="large">
            <ArrowForwardIosIcon fontSize='small' />
          </IconButton>
        </section>
        <Divider variant='middle' />
        <main className='chat-section'>
          <ChatWindow 
            chatState={currentDM.state} 
            loading={loading} 
            error={error}
            reload={reloadConversation}        
          />
          <ChatInput 
            recipient={{ participants: currentDM.participants, roomId: currentDM.id }} 
            sentMessageToRecipient={sentDM} 
            typeChat={TYPE_CHAT_DM}
            disabled={error || !currentDM.state.isConversationLoaded}
            loading={loading}
          />
        </main>
      </Paper>
    );
}

DM.propTypes = {
  currentDM: DMPropTypes.isRequired,
  sentDM: PropTypes.func.isRequired,
  closedDM: PropTypes.func.isRequired,
  childPopper: PropTypes.object,
  recipients: PropTypes.arrayOf(PublicUserPropTypes).isRequired,
  drawerToggle: PropTypes.bool.isRequired,
  error: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  reloadConversation: PropTypes.func.isRequired

}

const mapStateToProps = (state) => ({
  recipients: getOpenedDMRecipients(state),
  drawerToggle: getDrawerToggle(state),
})


export default connect(mapStateToProps, { sentDM, closedDM })(WithConversation(DM, TYPE_CHAT_DM));