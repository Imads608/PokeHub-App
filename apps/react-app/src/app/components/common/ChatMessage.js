import { Avatar } from '@mui/material';
import React from 'react';
import '../chat/chat.css';
import PropTypes from 'prop-types';

const ChatMessage = ({ username, message, timestamp }) => {
    const brokenMessageParts = message.split('\n');

    console.log('Timestamp', timestamp);

    return (
        <div className='chat-message'>
            <Avatar />
            <div className='chat-message-details'>
                <h4 style={{ margin: 0, color: 'darkred', fontFamily: 'Orbitron' }}>
                    {username}
                    <span className='chat-message-timestamp'>{new Date(timestamp).toLocaleTimeString({ hour: '2-digit', minute: '2-digit' })}</span>
                </h4>
                <p style={{ margin: 0, padding: 0, fontWeight: '800', color: 'darkslategray' }}>{brokenMessageParts.map((part, index) => (
                    index < brokenMessageParts.length - 1 ? <span key={index}>{part}<br /></span> : <span key={index}>{part}</span>
                ))}</p>
            </div>
        </div>
    )
}

ChatMessage.propTypes = {
    username: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired
}

export default ChatMessage;