import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getAllChatRooms } from '../selectors/chat';
import { getChatRooms as getChatRoomsThunk } from '../middleware-thunks/chat';
import { getChatRooms } from '../api/chat';
import { setOpenWindow, appLoaded } from '../actions/app';
import { fetchedChatRooms } from '../actions/chat';
import { getCurrentOpenedWindow, getAppLoading } from '../selectors/app';
import { useQuery } from 'react-query';
import useChatRoomsLoad from './useChatRoomsLoad';

const useInitialLoad = (type, payload) => {
  const currentWindow = useSelector(getCurrentOpenedWindow);
  const dispatch = useDispatch();
  const { data, error, isLoading } = useChatRoomsLoad(true);

  useEffect(() => {
    type &&
      (!currentWindow || (currentWindow && currentWindow.type !== type)) &&
      dispatch(setOpenWindow({ type, payload }));
  }, [data]);

  return { isLoading, data, error };
};

export default useInitialLoad;
