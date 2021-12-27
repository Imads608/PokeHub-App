import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  login_success,
  login_success_verification_needed,
  logout,
} from '../actions/common';
import { IUserData, IUserPublicProfileWithToken } from '@pokehub/user';
import { HYDRATE } from 'next-redux-wrapper';

export interface UserState {
  userDetails: IUserData | null;
  joinedPublicRooms: any[] | null;
}

const userSlice = createSlice({
  name: 'user-state',
  initialState: { userDetails: null, joinedPublicRooms: null } as UserState,
  reducers: {
    join_chatroom: (state: UserState, action: PayloadAction<any[]>) => {
      state.joinedPublicRooms = action.payload;
    },
    leave_chatroom: (state: UserState, action: PayloadAction<any[]>) => {
      state.joinedPublicRooms = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        login_success,
        (
          state: UserState,
          action: PayloadAction<IUserPublicProfileWithToken>
        ) => {
          state.userDetails = action.payload.user;
          state.joinedPublicRooms = action.payload.joinedPublicRooms;
        }
      )
      .addCase(
        login_success_verification_needed,
        (
          state: UserState,
          action: PayloadAction<IUserPublicProfileWithToken>
        ) => {
          state.userDetails = action.payload.user;
        }
      )
      .addCase(logout, (state: UserState) => {
        state.userDetails = null;
        state.joinedPublicRooms = null;
      })
      .addCase(HYDRATE, (state: UserState) => {
        return { ...state };
      });
  },
});

export const { join_chatroom, leave_chatroom } = userSlice.actions;
export default userSlice;
