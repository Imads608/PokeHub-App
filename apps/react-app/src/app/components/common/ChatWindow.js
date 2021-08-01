import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import '../chat/chat.css';
import { CircularProgress, Button } from '@material-ui/core';
import { SentimentVeryDissatisfied } from '@material-ui/icons';
import PropTypes from 'prop-types';

const ChatWindow = ({chatState, loading, error, reload}) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    
    useEffect(() => {
        scrollToBottom()
    }, [chatState.messages]);

    return (
        <div className='main-window'>
            { loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                    <CircularProgress color='secondary' /> 
                </div>
            ) : error ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column'}}>
                    <div style={{ fontSize: '20px' }} className='drawer-header'>Uh Oh. Could not load Conversation.</div>
                    <SentimentVeryDissatisfied fontSize='large' style={{ width: '80px', height: '80px', color: 'grey' }} />
                    <Button className='theme-text' color='secondary' variant='contained' onClick={reload}>Try Again?</Button>
                </div>
            ) : chatState.messages.map((message, index) => (
                <ChatMessage key={index} username={message.author.username} message={message.message} timestamp={new Date(message.time)} />
            ))}
            <div ref={messagesEndRef} />
        </div>
    )
}

ChatWindow.propTypes = {
    chatState: PropTypes.object,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.bool.isRequired,
    reload: PropTypes.func.isRequired
}

export default ChatWindow;