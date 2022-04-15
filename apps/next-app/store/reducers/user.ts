import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  login_success,
  login_success_verification_needed,
  logout,
} from '../actions/common';
import { IUserData, IUserProfile, IUserProfileWithToken, Status, TypeAccount } from '@pokehub/user/interfaces';
import { HYDRATE } from 'next-redux-wrapper';
import { IChatRoomData } from '@pokehub/chat/interfaces';
import { UserStatusUpdate } from '../../types/user';

export interface NamespaceClientIds {
  usersNS: string;
  roomsNS: string;
  dmsNS: string;
  isRefreshNeeded: boolean;
}

export enum SocketNamespaces {
  USERS_NAMESPACE = 'user-namespace',
  ROOMS_NAMESPACE = 'rooms-namespace',
  DMS_NAMESPACE = 'dms-namespace'
}

export interface UserState {
  userDetails: IUserData | null;
  joinedPublicRooms: IChatRoomData[] | null;
  profileSetup: boolean;
  clientIds?: NamespaceClientIds;
}

const userSlice = createSlice({
  name: 'user-state',
  initialState: { userDetails: null, joinedPublicRooms: null } as UserState,
  reducers: {
    user_data_update: (state: UserState, action: PayloadAction<IUserData>) => {
      state.userDetails = action.payload;
    },
    join_chatroom: (state: UserState, action: PayloadAction<IChatRoomData[]>) => {
      state.joinedPublicRooms = action.payload;
    },
    leave_chatroom: (state: UserState, action: PayloadAction<IChatRoomData[]>) => {
      state.joinedPublicRooms = action.payload;
    },
    status_update: (state: UserState, action: PayloadAction<UserStatusUpdate>) => {
      console.log('Status Update:', action.payload);
      state.userDetails.status = action.payload;
    },
    start_websocket_connection: (state: UserState) => {
      // Nothing to do here
    },
    websocket_connected: (state: UserState, action: PayloadAction<{ socketId: string, namespace: SocketNamespaces }>) => {
      if (action.payload.namespace === SocketNamespaces.USERS_NAMESPACE) state.clientIds.usersNS = action.payload.socketId;
      else if (action.payload.namespace === SocketNamespaces.ROOMS_NAMESPACE) state.clientIds.roomsNS = action.payload.socketId;
      else if (action.payload.namespace === SocketNamespaces.DMS_NAMESPACE) state.clientIds.dmsNS = action.payload.socketId;
    },
    websocket_disconnected: (state: UserState) => {
      state.clientIds.isRefreshNeeded = state.userDetails ? true : false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase( login_success, ( state: UserState, action: PayloadAction<IUserProfileWithToken | IUserProfile> ) => {
          const currStatus = action.payload.user.status;

          state.userDetails = action.payload.user;
          state.joinedPublicRooms = action.payload.joinedPublicRooms;
          //state.status = action.payload.status;
          state.clientIds = { usersNS: null, roomsNS: null, dmsNS: null, isRefreshNeeded: false };
          if (action.payload.user.account === TypeAccount.GOOGLE)
            state.profileSetup = action.payload.user.avatar && action.payload.user.countUsernameChanged > 0;
          else 
            state.profileSetup = !!action.payload.user.avatar;

          if (currStatus.state !== Status.APPEAR_AWAY && currStatus.state !== Status.APPEAR_BUSY && currStatus.state !== Status.APPEAR_OFFLINE)
            state.userDetails.status = { lastSeen: action.payload.user.status.lastSeen, state: Status.ONLINE, id: action.payload.user.status.id };
        }
      )
      .addCase( login_success_verification_needed, ( state: UserState, action: PayloadAction<IUserProfileWithToken | IUserProfile> ) => {
          state.userDetails = action.payload.user;
        }
      )
      .addCase(logout, (state: UserState) => {
        state.userDetails = null;
        state.joinedPublicRooms = null;
        //state.status = null;
      })
      .addCase(HYDRATE, (state: UserState, action: any) => {
        if (state.userDetails && !action.payload['auth-state'].isAuthenticated)
          return { ...state }
        else return { ...state, ...action.payload['user-state'] }
      });
  },
});

export const { join_chatroom, leave_chatroom, user_data_update, status_update, websocket_connected, websocket_disconnected, start_websocket_connection } = userSlice.actions;
export default userSlice;
