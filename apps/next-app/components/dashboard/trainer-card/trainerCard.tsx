
import { Avatar, CustomTheme, Divider, ListItem, ListItemButton, Paper } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import TrainerCardHeaderLeft from '../../../public/images/TrainerCardHeaderLeft.png';
import TrainerCardHeaderRight from '../../../public/images/TrainerCardHeaderRight.png';
import { IUserData } from '@pokehub/user/interfaces';
import Image from 'next/image';
import { ClassNameMap } from '@mui/styles';
import Link from 'next/link';

const useStyles = makeStyles((theme: CustomTheme) => ({
    root: {
        fontFamily: theme.palette.fontTextOptions.primary.fontFamily,
        color: 'white',
        height: '35%',
        width: '70%',
        padding: '5px',
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'wrap',
        position: 'relative',
        backgroundImage: `url('/images/TrainerCardBackground.png')`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    },
    title: {
        fontFamily: theme.palette.fontTextOptions.primary.fontFamily,
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
}));

const Title = ({ classes }: { classes: ClassNameMap<'title'> } ) => {
    return (
      <h3 className={classes.title}>
        <span>Profile</span>
      </h3>
    );
};

interface TrainerCardProps {
    user: IUserData
};


const TrainerCard = ({ user }: TrainerCardProps) => {
    const classes = useStyles();

    return (
        <>
            <Title classes={classes} />
            <Paper className={classes.root} elevation={4}>
                <div className={classes.header}>
                    <span style={{ marginRight: '5px', display: 'flex', alignItems: 'center' }}>
                        <Image height={30} width={20} src={TrainerCardHeaderLeft} alt='Trainer Card Header Left' />
                    </span>
                    <span>TRAINER CARD</span>
                    <span style={{ marginLeft: '5px', display: 'flex', alignItems: 'center' }}>
                        <Image height={30} width={20} src={TrainerCardHeaderRight} alt='Trainer Card Header Right' />
                    </span>
                </div>
                <div className={classes.body}>
                    <Avatar className={classes.avatar} src={user.avatarUrl ? user.avatarUrl : '#'} alt='User Avatar' />
                    <h4 style={{ marginBottom: 0 }}>
                        USERNAME
                    </h4>
                    <Divider variant="fullWidth" />
                    <h3 style={{ marginBottom: 0 }}>
                        {user.username}
                    </h3>
                </div>
                <div className={classes.content}>
                    <Link href='/dashboard' passHref>
                        <ListItemButton className={classes.link}>ABOUT</ListItemButton>
                    </Link>
                    <Link href='/dashboard?view=friends' passHref>
                        <ListItemButton className={classes.link}>FRIENDS</ListItemButton>
                    </Link>
                    <Link href='/dashboard?view=active-rooms' passHref>
                        <ListItemButton className={classes.link}>ACTIVE ROOMS</ListItemButton>
                    </Link>
                    <Link href='/dashboard?view=teams' passHref>
                        <ListItemButton className={classes.link}>TEAMS</ListItemButton>
                    </Link>
                </div>
            </Paper>
        </>
    );
  };
export default TrainerCard;