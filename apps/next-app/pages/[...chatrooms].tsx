/* eslint-disable @typescript-eslint/no-empty-function */
import makeStyles from '@mui/styles/makeStyles';
import { Theme } from '@mui/material/styles';
import { RootState, wrapper } from '../store/store';
import withLoadUser from '../hoc/auth/withLoadUser';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import GoogleButton from 'react-google-button';
import { getChatRoomsFake } from '../api/chat';
import { IChatRoom } from '@pokehub/chat/interfaces';
import { createTheme } from '@mui/material/styles';
import { CustomTheme, Grid, PaletteMode } from '@mui/material';
import React from 'react';
import { getMainAppDesignTokens } from '../styles/mui/themes/theme';
import { useSelector } from 'react-redux';
import { getAppTheme } from '../store/selectors/app';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import ChatRoomsNavbar from '../components/chat/rooms/chatroomsNavbar';
import { useRouter } from 'next/router';
import { get_chatrooms_success } from '../store/reducers/room';
import ChatRoomMainWindow from '../components/chat/rooms/chatroomMainWindow';

const useStyles = makeStyles((theme: Theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

export const getServerSideProps: GetServerSideProps<{ chatrooms: IChatRoom[] }> = wrapper.getServerSideProps((store) => async ({ req, res }) => {
    //await withLoadUser.isAuth({ req, res, store, isOAuthLogin: false });
    //res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59')

    const chatrooms = await getChatRoomsFake();
    store.dispatch(get_chatrooms_success(chatrooms));

    return {
        props: {
            chatrooms,
        }
    }
});

const ChatRooms = ({ chatrooms }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const classes = useStyles();
  const mode: PaletteMode = useSelector<RootState, PaletteMode>(getAppTheme);
  const appTheme: CustomTheme = React.useMemo((): CustomTheme => createTheme(getMainAppDesignTokens(mode)), [mode]);
  const router = useRouter();
  const { routeMatches } = router.query;

  console.log('ChatRooms: ', chatrooms, routeMatches);
  return (
      <ThemeProvider theme={appTheme}>
          <main style={{ height: '93vh', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <Grid container spacing={0}>
            <Grid item md={2}>
                <ChatRoomsNavbar chatrooms={chatrooms} />
            </Grid>
            <Grid item md={10}>
                <ChatRoomMainWindow />
            </Grid>
        </Grid>
          </main>
      </ThemeProvider>
  )
};

export default ChatRooms
