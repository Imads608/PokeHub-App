import { CustomTheme } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

export const useTrainerCardStyles = () => {
    return makeStyles()((theme: CustomTheme) => ({
        root: {
            color: 'white',
            height: '35%',
            width: '70%',
            padding: '5px',
            display: 'flex',
            marginTop: '10px',
            flexDirection: 'column',
            flexWrap: 'wrap',
            position: 'relative',
            backgroundImage: `url('/images/TrainerCardBackground.png')`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        },
        title: {
            color: theme.palette.primary.main,
            fontSize: 'x-large',
            width: '50%',
            textAlign: 'center',
            borderBottom: '3px solid darkgrey',
            lineHeight: '0.1em',
            margin: '25px 0',
            '& span': {
                padding: '0 10px',
                backgroundColor: theme.palette.background.default
            }
        },
        header: {
            display: 'flex',
            alignItems: 'center'
        },
        body: {
            marginLeft: '10px',
            marginTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'wrap',
            width: '40%',
            '& h3': {
                padding: '5px',
                backgroundColor: theme.palette.primary.main,
                borderRadius: '5px',
                width: '95%'
            }
        },
        avatar: {
            marginTop: '10px',
            marginRight: '10px',
            width: '100px',
            height: '100px'
        },
        content: {
            display: 'flex',
            flexDirection: 'column',
            fontSize: 'large'
        },
        link: {
            margin: '10px 0'
        }
    }))();
};
