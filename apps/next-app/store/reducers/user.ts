import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  login_success,
  login_success_verification_needed,
  logout,
} from '../actions/common';
import { IUserData, IUserProfile, IUserProfileWithToken, IUserStatusData, Status, TypeAccount } from '@pokehub/user/interfaces';
import { HYDRATE } from 'next-redux-wrapper';
import { IChatRoomData } from '@pokehub/room/interfaces';

export interface UserState {
  userDetails: IUserData | null;
  joinedPublicRooms: IChatRoomData[] | null;
  profileSetup: boolean;
  status: IUserStatusData;
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
    status_update: (state: UserState, action: PayloadAction<IUserStatusData>) => {
      state.status = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase( login_success, ( state: UserState, action: PayloadAction<IUserProfileWithToken | IUserProfile> ) => {
          state.userDetails = action.payload.user;
          state.joinedPublicRooms = action.payload.joinedPublicRooms;
          state.status = action.payload.status;
          if (action.payload.user.account === TypeAccount.GOOGLE)
            state.profileSetup = action.payload.user.avatar && action.payload.user.countUsernameChanged > 0;
          else 
            state.profileSetup = !!action.payload.user.avatar;
        }
      )
      .addCase( login_success_verification_needed, ( state: UserState, action: PayloadAction<IUserProfileWithToken | IUserProfile> ) => {
          state.userDetails = action.payload.user;
        }
      )
      .addCase(logout, (state: UserState) => {
        state.userDetails = null;
        state.joinedPublicRooms = null;
        state.status = null;
      })
      .addCase(HYDRATE, (state: UserState, action: any) => {
        return {
          ...state,
          ...action.payload['user-state']
        }
      });
  },
});

export const { join_chatroom, leave_chatroom, user_data_update, status_update } = userSlice.actions;
export default userSlice;
