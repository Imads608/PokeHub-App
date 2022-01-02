import { Theme, ThemeProvider, useTheme } from '@emotion/react';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { Button, Container, MobileStepper } from '@mui/material';
import { CustomTheme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { IUserData } from '@pokehub/user';
import { useState } from 'react';
import SwipeableViews from 'react-swipeable-views';
import UserNameSetup from './userNameSetup';

const useStyles = makeStyles((theme: CustomTheme) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    fontFamily: theme.palette.fontTextOptions.primary.fontFamily,
    color: theme.palette.primary.main,
    borderRadius: '5px',
    height: '40%',//20%,
    display: 'flex',
    flexDirection: 'column'
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
  }
}));

const UserGuide = ({ user }: { user: IUserData}) => {
    const classes = useStyles();
    const maxSteps = 2;
    const [ activeStep, setActiveStep ] = useState<number>(0);
    console.log('UserGuide theme background color');

    const handleNext = () => {
        setActiveStep(activeStep+1);
    }

    const handleBack = () => {
        setActiveStep(activeStep-1);
    }

    const handleStepChange = (step: number) => {
        setActiveStep(step);
    }

    return (
        <Container className={classes.root} fixed>
            <div style={{ alignSelf: 'center', margin: '10px 0' }}>
                Welcome to PokeHub
            </div>
            <SwipeableViews 
                index={activeStep}
                onChangeIndex={handleStepChange}
                style={{ fontSize: 'large', flex: 1, marginTop: '10px', alignSelf: 'center', display: 'flex', flexDirection: 'column', height: '100%' }}
            >
                <div style={{ height: '20vh', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', flexWrap: 'wrap' }} className='theme-text'>
                    <span>{"Thanks for joining. We noticed that you haven't set your username and profile picture."}</span>
                    <span>{"Let's finish setting up your profile."}</span>
                </div>
                <UserNameSetup />
            </SwipeableViews>
            <MobileStepper
                className={classes.stepper}
                steps={maxSteps}
                position="static"
                activeStep={activeStep}
                nextButton={
                    <Button 
                        className={classes.button}
                        onClick={handleNext} 
                        disabled={activeStep === maxSteps-1} 
                        style={{ color: activeStep === maxSteps-1 ? 'grey' : 'white' }} 
                        size="small">
                        <span>Next</span> 
                        <KeyboardArrowRight />
                    </Button>
                }
                backButton={
                    <Button 
                        className={classes.button}
                        style={{ color: activeStep === 0 ? 'darkgrey' : 'white' }} 
                        size="small" 
                        onClick={handleBack} 
                        disabled={activeStep === 0}
                    >
                        <span>Back</span> 
                        <KeyboardArrowLeft />
                    </Button>
                }
            />
        </Container>
    )
}

export default UserGuide;