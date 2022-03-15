import 'firebase/auth';
import { auth } from '../firebase';
import { provider } from '../firebase';
import {
  loggedIn,
  authFailure,
  resetAuthError,
  loggedOut,
  setAuthLoaded,
} from '../actions/auth';
import { appLoaded } from '../actions/app';
import {
  getRequestHeaderWithToken,
  getAPIRequestHeader,
  setAuthToken,
} from '../utils';
import appConfig from '../config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useInterceptors } from '../axios';
import {
  getCurrentUserData,
  createUser as createUserData,
  getNewAccessToken,
  loadUser as loadUserAPI,
} from '../api/auth';
import { PermCameraMic } from '@mui/icons-material';

let shouldCreateUser = false;

const loadUserDataAndDispatchLoginState = async (dispatch, user) => {
  const { uid, displayName, photoURL, email, emailVerified } = user;
  const token = await user.getIdToken();
  try {
    const userServiceRes = await getCurrentUserData(uid);
    dispatch(
      loggedIn({
        token: token,
        user: {
          uid,
          name: displayName,
          email,
          emailVerified,
          username: userServiceRes.username,
          first_name: userServiceRes.first_name,
          last_name: userServiceRes.last_name,
          joinedRooms: userServiceRes.joinedRooms,
        },
      })
    );
  } catch (err) {
    /*if (err.response && err.response.status === 400) {
            dispatch(loggedIn({
                token,
                user: {uid, name: displayName, avatar: photoURL, email, emailVerified},
                userData: null
            }))
        } else */
    if (err.response && err.response.status === 400) {
      const tempUsername = `user_${uuidv4()}`;
      await createUserDataAndDispatchLoginState(
        dispatch,
        user,
        tempUsername,
        user.email
      );
    } else if (err.response && err.response.status === 500) {
      dispatch(authFailure(err.response.data));
      dispatch(logoutUser);
    } else {
      dispatch(authFailure(err));
      dispatch(logoutUser);
    }
  }
};

const createUserDataAndDispatchLoginState = async (
  dispatch,
  user,
  username,
  email
) => {
  try {
    const token = await user.getIdToken();
    const userServiceRes = await createUserData(username, email, user.uid);
    dispatch(
      loggedIn({
        token: token,
        user: {
          uid: user.uid,
          name: user.displayName,
          email,
          emailVerified: user.emailVerified,
          username: userServiceRes.username,
          first_name: userServiceRes.first_name,
          last_name: userServiceRes.last_name,
          joinedRooms: userServiceRes.joinedRooms,
        },
      })
    );
  } catch (err) {
    if (err.response) dispatch(authFailure(err.response.data));
    else dispatch(authFailure(err));
    dispatch(loggedOut);
  }
};

export const loadUser = () => async (dispatch) => {
  try {
    if (!localStorage.getItem('pokehub-refresh-token')) {
      dispatch(appLoaded());
      dispatch(setAuthLoaded());
    } else {
      const refreshToken = localStorage.getItem('pokehub-refresh-token');
      console.log('Refresh token: ', typeof refreshToken);
      const accessToken = await getNewAccessToken(refreshToken);
      console.log('Received access token:', accessToken);
      const userData = await loadUserAPI(accessToken);
      dispatch(
        loggedIn({
          token: accessToken,
          user: userData,
        })
      );
    }
  } catch (err) {
    console.log('Got error loading user: ', err);
    dispatch(authFailure(err));
  }
};

export const loadUserOld = () => async (dispatch) => {
  try {
    auth.onAuthStateChanged(async function (user) {
      console.log('In');
      if (user) {
        console.log('On Auth State Changed ', user.providerData);
        setAuthToken(await user.getIdToken());
        if (!shouldCreateUser) {
          await loadUserDataAndDispatchLoginState(dispatch, user);
        }
      } else {
        dispatch(appLoaded());
        dispatch(setAuthLoaded());
      }
    });
  } catch (err) {
    console.log(err);
    dispatch(authFailure(err));
  }
};

export const googleSignIn = () => async (dispatch) => {
  try {
    const result = await auth.signInWithPopup(provider);
  } catch (err) {
    dispatch(authFailure(err));
  }
};

export const createUser = (username, email, password) => async (dispatch) => {
  try {
    shouldCreateUser = true;
    const fbAuthRes = await auth.createUserWithEmailAndPassword(
      email,
      password
    );
    console.log('Got result from creating user', fbAuthRes);
    shouldCreateUser = false;
    await createUserDataAndDispatchLoginState(
      dispatch,
      fbAuthRes.user,
      username,
      email
    );
  } catch (err) {
    console.log('Error', err);
    dispatch(authFailure(err));
  }
};

export const defaultLogIn = (email, password) => async (dispatch) => {
  try {
    const res = await auth.signInWithEmailAndPassword(email, password);
    console.log('Res Login', res);
  } catch (err) {
    dispatch(authFailure(err));
  }
};

export const logoutUser = () => async (dispatch) => {
  console.log('Logging out user');
  dispatch(loggedOut());
};

export const logoutUserOld = () => async (dispatch) => {
  console.log('Logging out user');
  try {
    await auth.signOut();
    dispatch(loggedOut());
  } catch (err) {
    dispatch(authFailure(err));
  }
};
