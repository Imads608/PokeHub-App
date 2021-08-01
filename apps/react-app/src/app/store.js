import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { connectWebSocketMiddleware } from './middleware/socket';
import thunk from 'redux-thunk';
import rootReducer from './reducers';
import * as actionCreators from './actions/chat';
import { configureStore } from '@reduxjs/toolkit';
import appReducer from './reducers/app';
import authReducer from './reducers/auth';
import chatReducer from './reducers/chat';
import drawerReducer from './reducers/drawer';
import notificationReducer from './reducers/notification';
import userReducer from './reducers/user';

const initialState = {};

const store = configureStore({
    reducer: {
        app: appReducer,
        auth: authReducer,
        chat: chatReducer,
        drawer: drawerReducer,
        user: userReducer,
        notification: notificationReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }).concat(connectWebSocketMiddleware)
})
/*
const middleWare = [thunk, connectWebSocketMiddleware ];
const composeEnhancers = composeWithDevTools({ actionCreators, trace: true, traceLimit: 25 })
const store = createStore(
    rootReducer, initialState, composeEnhancers(applyMiddleware(...middleWare))
);*/

export default store;