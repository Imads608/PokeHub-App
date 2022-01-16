import { Theme, ThemeProvider, useTheme } from '@emotion/react';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { Button, CircularProgress, Collapse, Container, MobileStepper } from '@mui/material';
import { CustomTheme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { IUserData } from '@pokehub/user/interfaces';
import { useEffect, useState } from 'react';
import SwipeableViews from 'react-swipeable-views';
import AvatarSetup from './avatarSetup';
import UserNameSetup from './userNameSetup';
import { useSetupUsername } from '../../../hooks/user/useSetupUsername';
import { useSetupUserAvatar } from '../../../hooks/user/useSetupUserAvatar';
import CloseIcon from '@mui/icons-material/Close';
import { TypeAccount } from '@pokehub/user/interfaces';

const useStyles = makeStyles((theme: CustomTheme) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    fontFamily: theme.palette.fontTextOptions.primary.fontFamily,
    color: theme.palette.primary.main,
    borderRadius: '5px',
    height: '300px',//20%,
    display: 'flex',
    flexDirection: 'column',
    transition: 'ease-out 1s'
  },
  stepper: {
      marginBottom: '5px',
      borderRadius: '5px',
      backgroundColor: theme.palette.background.paper
  },
  button: {
      fontFamily: theme.palette.fontTextOptions.primary.fontFamily,
      "&:hover": {
          backgroundColor: theme.palette.mode == 'light' ? 'rgba(208,52,57,0.2)' : 'rgba(35,35,37,1.0)',
      }
  },
  mainBody: {
    fontSize: 'large', 
    flex: 1, 
    marginTop: '10px', 
    alignSelf: 'center', 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%'
  }
}));

const UserGuide = ({ user, close }: { user: IUserData, close: () => void }) => {
    const classes = useStyles();
    const maxSteps = user.account === TypeAccount.GOOGLE && user.countUsernameChanged === 0 ? 3 : 2;
    const [ activeStep, setActiveStep ] = useState<number>(0);
    const [ chosenUsername, setChosenUsername ] = useState<string>(null);
    const [ chosenAvatar, setChosenAvatar ] = useState<FormData>(null);
    const [submit, setSubmit] = useState<boolean>(false);
    const usernameMutation = useSetupUsername();
    const avatarMutation = useSetupUserAvatar();

    const handleNext = () => {
        if (activeStep+1 === maxSteps-1 && maxSteps === 3)
            usernameMutation.mutate({ ...user, username: chosenUsername } as IUserData);
        setActiveStep(activeStep+1);
    }

    const handleBack = () => {
        setActiveStep(activeStep-1);
    }

    const setUsername = (username: string) => {
        console.log('UserGuide setUsername: ', username);
        setChosenUsername(username);
    }

    const setAvatar = (avatar: FormData) => {
        setChosenAvatar(avatar);
    }

    const handleSubmit = () => {
        setSubmit(true);
        chosenAvatar && avatarMutation.mutate({ uid: user.uid, avatar: chosenAvatar });
    }

    const resetMutations = () => {
        setSubmit(false);
        usernameMutation.reset();
        avatarMutation.reset();
    }

    const nextDisabled: boolean = (activeStep === 1 && !chosenUsername && maxSteps === 3) || usernameMutation.isLoading || 
                                    avatarMutation.isLoading || submit;//|| (usernameMutation.isSuccess && (!chosenAvatar || avatarMutation.isSuccess));// || (activeStep === maxSteps-1 && !chosenAvatar);
    /*const prevDisabled = activeStep === 0 || activeStep === maxSteps-1 || usernameMutation.isLoading || avatarMutation.isLoading || 
                         (usernameMutation.isSuccess && (!chosenAvatar || avatarMutation.isSuccess));*/

    console.log('userGuide Active Step: ', activeStep, usernameMutation.isSuccess, avatarMutation.isSuccess, chosenUsername);
    return (
        <Container className={classes.root} fixed>
            <div style={{ display: 'flex', alignItems: 'center', margin: '10px' }}>
                <Button disabled={ usernameMutation.isLoading || avatarMutation.isLoading } onClick={close}>
                    <CloseIcon color='primary' />
                </Button>
                <div style={{ margin: 'auto' }}>
                    Welcome to PokeHub
                </div>
            </div>
            { usernameMutation.isLoading || avatarMutation.isLoading ? (
                    <div style={{ height: '20vh' }} className={classes.mainBody}>
                        <div>Please Wait</div>
                        <CircularProgress color='secondary' />
                    </div> 
                ) : usernameMutation.isError || avatarMutation.isError ? (
                    <div style={{ height: '30px' }} className={classes.mainBody}>
                        <div>Uh Oh Looks Like an Error Occurred</div>
                        <Button variant='contained' component='span' onClick={resetMutations}>Go Back</Button>
                    </div> 
                ) : submit && (!chosenAvatar || avatarMutation.isSuccess) ? (
                    <div className={classes.mainBody}>
                        <div>Your Profile has been set up!</div>
                        <div>You can close this window now.</div>
                    </div>
                ) : (
                    <SwipeableViews 
                        index={activeStep}
                        className={classes.mainBody}
                    >
                        <div style={{ height: '20vh', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', 
                                    flexWrap: 'wrap' }} className='theme-text'>
                            <span>{"Thanks for joining."}</span>
                            <span>{"We noticed that your profile is incomplete"}</span>
                            <span>{"Let's finish setting it up."}</span>
                        </div>
                        { maxSteps === 2 ? (
                                <AvatarSetup avatarChosen={setAvatar} />
                                ) : (
                              <>
                                <UserNameSetup usernameChosen={setUsername} />
                                <AvatarSetup avatarChosen={setAvatar} />
                              </>
                          )}
                    </SwipeableViews>
                )
            }
            <MobileStepper
                className={classes.stepper}
                steps={maxSteps}
                position="static"
                activeStep={activeStep}
                nextButton={
                    <Button 
                        className={classes.button}
                        onClick={activeStep === maxSteps-1 ? handleSubmit : handleNext} 
                        disabled={nextDisabled} 
                        style={{ color: nextDisabled ? 'darkgrey' : 'white' }} 
                        size="small">
                        <span>{ activeStep === maxSteps-1 ? 'Finish' : 'Next' }</span> 
                        { activeStep < maxSteps-1 && <KeyboardArrowRight /> }
                    </Button>
                }
                backButton={
                    <Button 
                        className={classes.button}
                        style={{ visibility: 'hidden' }} 
                        size="small" 
                        onClick={handleBack} 
                        disabled={true}
                    >
                        <KeyboardArrowLeft />
                        <span>Back</span> 
                    </Button>
                }
            />
        </Container>
    )
}

export default UserGuide;