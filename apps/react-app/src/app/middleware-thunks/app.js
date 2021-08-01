import { requestFailure, requestStarted } from '../actions/app';
import { joinedChatRoom, leftChatRoom } from '../actions/app';
import { getChatRoomFromDB, addUserToChatRoom, removeUserFromChatRoom } from './chat';
import axios from 'axios';
import appConfig  from '../config'
import { getAPIRequestHeader } from '../utils';
