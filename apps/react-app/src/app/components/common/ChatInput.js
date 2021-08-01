import React, { useEffect, useState, useCallback } from 'react';
import Paper from "@material-ui/core/Paper";
import InputBase from '@material-ui/core/InputBase';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { sentMessageToChatRoom } from '../../actions/chat'
import { OpenWithRounded } from '@material-ui/icons';
import { v4 as uuidv4 } from 'uuid';
import { getPublicUser } from '../../selectors/user'
import '../chat/chat.css';
import debounce from 'lodash/debounce';
import { socket } from '../../middleware/socket';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import { PublicUserPropTypes } from '../../types/user';
import { TYPE_CHAT_CHATROOM } from '../../types/chatroom';
import { USER_IS_TYPING, USER_STOPPED_TYPING } from '../../types/chat';
import { TYPE_CHAT_DM, JOIN_DMs } from '../../types/dm';


const useStyles = makeStyles((theme) => ({
      input: {
        padding: '15px 12px', 
        width: '95%', 
        border: 'none', 
        borderRadius: '5px', 
        resize: 'none', 
        outline: 'none', 
        marginLeft: '10px', 
        fontFamily: 'Arial', 
        fontSize: '16px'
      }
  }));

const ChatInput = ( { recipient, publicUser: { username, uid }, sentMessageToRecipient, typeChat, disabled } ) => {
    const classes = useStyles();
    const [ chatText, setChatText ] = useState('');
    const [ isTyping, setIsTyping ] = useState(false);
    const [ otherUsersTyping, setOtherUsersTyping] = useState([]);

    useEffect(() => {
        typeChat === TYPE_CHAT_DM && socket.emit("JOIN_DMs", [recipient.roomId]);
        socket.on(USER_IS_TYPING, (msg) => {
            console.log('User is typing', msg);
            if (socket.id !== msg.socketId && ((typeChat === TYPE_CHAT_DM && msg.room === recipient.roomId) || (typeChat === TYPE_CHAT_CHATROOM && recipient.name === msg.room))) {
                setOtherUsersTyping(otherUsersTyping.concat(msg.username));
            }
        });

        socket.on(USER_STOPPED_TYPING, (msg) => {
            //console.log('User stopped typing', msg);
            if (socket.id !== msg.socketId && ((typeChat === TYPE_CHAT_DM && msg.room === recipient.roomId) || (typeChat === TYPE_CHAT_CHATROOM && recipient.name === msg.room))) {
                setOtherUsersTyping(otherUsersTyping.filter(username => username !== msg.username));
            }
        })
    }, []);

    useEffect(() => {
        debounceTyping();
    }, [chatText]);

    const handleTyping = () => {
        setIsTyping(false);
        socket.emit(USER_STOPPED_TYPING, { socketId: socket.id, type: USER_STOPPED_TYPING, username, to: typeChat === TYPE_CHAT_DM ? recipient.roomId : recipient.name, room: typeChat === TYPE_CHAT_DM ? recipient.roomId : recipient.name });
    };

    const debounceTyping = useCallback(debounce(handleTyping, 500), []);

    const onChatTextChanged = (e) => {
        setChatText(e.target.value);
        setIsTyping(true);
        socket.emit(USER_IS_TYPING, { socketId: socket.id, type: USER_IS_TYPING, username, to: typeChat === TYPE_CHAT_DM ? recipient.roomId : recipient.name, room: typeChat === TYPE_CHAT_DM ? recipient.roomId : recipient.name });
    }

    const sendMessage = (e) => {
        e.preventDefault();
        console.log('Recipient is', recipient);
        const message = typeChat === TYPE_CHAT_DM ? getDM() : getChatRoomMessage();
        sentMessageToRecipient(message);
        setChatText('');
    }

    const getDM = () => {
        return {
            id: uuidv4(),
            message: chatText, 
            author: {
                username,
                uid,
            },
            time: new Date().toLocaleDateString(),
            roomId: recipient.roomId,
            to: recipient.participants
        }
    }

    const getChatRoomMessage = () => {
        return {
            id: uuidv4(),
            message: chatText, 
            author: {
                username,
                uid,
            },
            time: new Date().toLocaleDateString(),
            roomId: recipient.id,
            to: recipient.name
        }
    }

    const onEnterPress = (e) => {
        if(e.keyCode == 13 && e.shiftKey == false) {
          sendMessage(e);
        }
      }

    const placeholder = typeChat === TYPE_CHAT_DM && recipient.participants.length === 2 ? `Message @${recipient.participants[1].username}` : 
                        typeChat === TYPE_CHAT_DM ? 'Message @Group' : `Message @${recipient.name}`;

    return (
        <div className='chat-input'>
            { otherUsersTyping.length > 0 ? <div style={{ marginLeft: '15px', fontSize: 'small' }}>
                {otherUsersTyping.length === 1 ? `${otherUsersTyping[0]} is typing` 
                : otherUsersTyping.length === 2 ? `${otherUsersTyping[0]} and ${otherUsersTyping[1]} are typing` 
                : `${otherUsersTyping[0]}, ${otherUsersTyping[1]} and ${otherUsersTyping.length-2} are typing` }</div> : '' }
            <TextareaAutosize
                rowsMax={5}
                className={classes.input}
                aria-label="maximum height"
                placeholder={placeholder}
                value={chatText}
                onChange={onChatTextChanged}
                onKeyDown={onEnterPress}
                disabled={disabled}
            />         
        </div>
    )
}

ChatInput.propTypes = {
    recipient: PropTypes.object.isRequired,
    publicUser: PublicUserPropTypes.isRequired,
    typeChat: PropTypes.string.isRequired,
    sentMessageToRecipient: PropTypes.func.isRequired,
    disabled: PropTypes.bool.isRequired
}

const mapStateToProps = (state) => ({
    publicUser: getPublicUser(state),
})

export default connect(mapStateToProps)(ChatInput);