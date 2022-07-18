import { Theme, ThemeProvider, useTheme } from '@emotion/react';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { Button, CircularProgress, Collapse, Container, MobileStepper } from '@mui/material';
import { CustomTheme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { IUserData } from '@pokehub/user/interfaces';
import { useState } from 'react';
import SwipeableViews from 'react-swipeable-views';
import AvatarSetup from './avatarSetup';
import UserNameSetup from './userNameSetup';
import CloseIcon from '@mui/icons-material/Close';
import { useUserProfileMutation } from '../../../hooks/user/useUserProfileMutation';

const useStyles = makeStyles((theme: CustomTheme) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.primary.main,
    borderRadius: '5px',
    width: '75%',
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
      fontFamily: theme.typography.fontFamily,
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
    overflox: 'hidden'
  }
}));

const UserGuide = ({ user, close }: { user: IUserData, close: () => void }) => {
    const classes = useStyles();
    const maxSteps = 2;
    const [ activeStep, setActiveStep ] = useState<number>(0);
    const [ chosenUsername, setChosenUsername ] = useState<string>(null);
    const [ chosenAvatar, setChosenAvatar ] = useState<FormData>(null);
    const [submit, setSubmit] = useState<boolean>(false);
    const profileMutation = useUserProfileMutation();

    const handleNext = () => {
        setActiveStep(activeStep+1);
    }

    const handleBack = () => {
        setActiveStep(activeStep-1);
    }

    const setUsername = (username: string) => {
        console.log('UserGuide setUsername: ', username, username === "", !username);
        setChosenUsername(username);
    }

    const setAvatar = (avatar: FormData) => {
        setChosenAvatar(avatar);
    }

    const handleSubmit = () => {
        setSubmit(true);
        const updatedProfile: IUserData = { ...user, username: chosenUsername ? chosenUsername : user.username };
        const updatedBlob = new Blob([JSON.stringify(updatedProfile)], { type: 'application/json' });
        const profileUpdatesForm = chosenAvatar || new FormData();
        profileUpdatesForm.append('user', JSON.stringify(updatedProfile));
        (chosenUsername || chosenAvatar) && profileMutation.mutate({ userId: user.uid, updates: profileUpdatesForm });
    }

    const resetForm = () => {
        setSubmit(false);
        profileMutation.reset();
        setChosenUsername(null);
        setChosenAvatar(null);
    }

    const nextDisabled: boolean = (activeStep === 1 && !chosenUsername && chosenUsername !== "" && maxSteps === 2) || profileMutation.isLoading || submit;

    console.log('userGuide Active Step: ', activeStep, profileMutation.isSuccess, chosenUsername);
    return (
        <Container className={classes.root} fixed>
            <div style={{ display: 'flex', alignItems: 'center', margin: '10px' }}>
                <Button style={{ position: 'absolute' }} disabled={ profileMutation.isLoading } onClick={close}>
                    <CloseIcon color='primary' />
                </Button>
                <div style={{ justifyContent: 'center', flex: '1', textAlign: 'center' }}>
                    Welcome to PokeHub
                </div>
            </div>
            { profileMutation.isLoading ? (
                    <div style={{ height: '20vh', margin: '5px' }} className={classes.mainBody}>
                        <div>Please Wait</div>
                        <CircularProgress style={{ marginTop: '5px' }} color='secondary' />
                    </div> 
                ) : profileMutation.isError ? (
                    <div style={{ height: '30px' }} className={classes.mainBody}>
                        <div>Uh Oh. Looks Like Something Went Wrong!</div>
                        <Button style={{ margin: '5px 0' }} variant='contained' component='span' onClick={resetForm}>Go Back</Button>
                    </div> 
                ) : submit ? (
                    <div className={classes.mainBody}>
                        <div>Your Profile has been set up!</div>
                        <div>You can close this window now.</div>
                    </div>
                ) : (
                    <SwipeableViews 
                        index={activeStep}
                        className={classes.mainBody}
                    >
                        <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', 
                                    flexWrap: 'wrap', height: '100%' }} className='theme-text'>
                            <span>{"Thanks for joining."}</span>
                            <span>{"We noticed that your profile is incomplete"}</span>
                            <span>{"Let's finish setting it up."}</span>
                        </div>
                        <>
                            <UserNameSetup usernameChosen={setUsername} />
                            <AvatarSetup avatarChosen={setAvatar} />
                        </>
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