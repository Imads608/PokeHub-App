import { Avatar, Divider, IconButton } from '@mui/material';
import React, { useEffect } from 'react';
import ChatInput from '../../common/ChatInput';
import ChatWindow from '../../common/ChatWindow';
import { sentDM, closedDM } from '../../../actions/chat';
import { setErrorNotification } from '../../../actions/notification';
import { setOpenWindow } from '../../../actions/app';
import { getOpenedDMRecipients } from '../../../selectors/chat';
import { getCurrentOpenedWindow } from '../../../selectors/app';
import { OpenedWindowPropTypes, DM as DM_WINDOW } from '../../../types/app';
import WithConversation from '../../hoc/WithConversation';
import { DMPropTypes, VIEW_TYPE_LINK, VIEW_TYPE_POPPER, TYPE_CHAT_DM } from '../../../types/dm';
import { PublicUserPropTypes } from '../../../types/user';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router';
import Loading from '../../layout/Loading';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { Link } from 'react-router-dom';
import Tooltip from '@mui/material/Tooltip';
import '../chat.css';


const DM = ({ recipients, currentDM, sentDM, closedDM, loading, setOpenWindow, currentWindow, error, reloadConversation, setErrorNotification }) => {
    useEffect(() => {
        currentDM && currentDM.state.viewType === VIEW_TYPE_LINK && (currentWindow.payload === null || currentWindow.type !== DM_WINDOW || 
        (currentWindow.type === DM_WINDOW && currentWindow.payload.id !== currentDM.id)) && 
        setOpenWindow({ type: DM_WINDOW, payload: { id: currentDM.id, name: '' }});

        !currentDM && error && setErrorNotification('Unable to get DM Details', 'AlertNotification', 'SET_DM_ACTIVE', null);
    }, [currentDM, error]);
    
    return currentDM && !loading && currentDM.state.viewType === VIEW_TYPE_POPPER ? <Redirect to='/dashboard' /> :
    !currentDM && error ? <Redirect to='/dashboard' /> :
    currentDM && !loading ? (
        <div className='main-view'>
            <section className='dm-header'>
                <div className='dm-header-left-group'>
                    <Tooltip title='Start a New DM'>
                        <IconButton
                            color="inherit"
                            component={Link}
                            to='/dms'
                            aria-label="open drawer"
                            edge="end"
                            onClick={() => closedDM(currentDM.id)}
                            style={{ marginRight: '5px' }}
                            size="large">
                            <ArrowBackIosIcon fontSize='small' />
                        </IconButton>
                    </Tooltip>
                    <Avatar style={{ marginRight: '10px' }} src='/broken-image.jpg' />
                    <span className='lead'>{recipients[0].username}</span>
                </div>
            </section>
            <main className='chat-section'>
                <ChatWindow chatState={currentDM.state} loading={loading} error={error} reload={reloadConversation} />
                <ChatInput 
                    recipient={{ participants: currentDM.participants, roomId: currentDM.id }} 
                    sentMessageToRecipient={sentDM} 
                    typeChat={TYPE_CHAT_DM} 
                    disabled={error || loading} 
                />
            </main>
        </div>
    ) : loading ? <Loading /> : <Redirect to='/dashboard' />;
}

DM.propTypes = {
  currentDM: DMPropTypes,
  sentDM: PropTypes.func.isRequired,
  closedDM: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired, 
  setOpenWindow: PropTypes.func.isRequired,
  currentWindow: OpenedWindowPropTypes,
  recipients: PropTypes.arrayOf(PublicUserPropTypes),
  error: PropTypes.bool.isRequired,
  reloadConversation: PropTypes.func.isRequired,
  setErrorNotification: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({
  recipients: getOpenedDMRecipients(state),
  currentWindow: getCurrentOpenedWindow(state),
})


export default connect(mapStateToProps, { sentDM, closedDM, setOpenWindow, setErrorNotification })(WithConversation(DM, TYPE_CHAT_DM));