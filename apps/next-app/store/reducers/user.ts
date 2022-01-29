import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  login_success,
  login_success_verification_needed,
  logout,
} from '../actions/common';
import { IUserData, IUserPublicProfile, IUserPublicProfileWithToken } from '@pokehub/user/interfaces';
import { HYDRATE } from 'next-redux-wrapper';
import { IChatRoomData } from '@pokehub/room/interfaces';

export interface UserState {
  userDetails: IUserData | null;
  joinedPublicRooms: IChatRoomData[] | null;
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
  },
  extraReducers: (builder) => {
    builder
      .addCase( login_success, ( state: UserState, action: PayloadAction<IUserPublicProfileWithToken | IUserPublicProfile> ) => {
          state.userDetails = action.payload.user;
          state.joinedPublicRooms = action.payload.joinedPublicRooms;
        }
      )
      .addCase( login_success_verification_needed, ( state: UserState, action: PayloadAction<IUserPublicProfileWithToken | IUserPublicProfile> ) => {
          state.userDetails = action.payload.user;
        }
      )
      .addCase(logout, (state: UserState) => {
        state.userDetails = null;
        state.joinedPublicRooms = null;
      })
      .addCase(HYDRATE, (state: UserState, action: any) => {
        return {
          ...state,
          ...action.payload['user-state']
        }
      });
  },
});

export const { join_chatroom, leave_chatroom, user_data_update } = userSlice.actions;
export default userSlice;
