import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCommentAlt, faGamepad, faBookOpen, faBook } from '@fortawesome/free-solid-svg-icons';
import NavigationLinkItem from './navigationLinkItem';
import { CustomTheme } from '@mui/material';
import PokedexIcon from '../../../public/svg/surprised-pikachu-meme.svg';
import Image from 'next/image';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()((theme: CustomTheme) => ({
    root: {
        display: 'flex',
        color: theme.palette.primary.main,
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '10px 0'
    },
    header: {
        fontSize: 'x-large',
        width: '50%',
        textAlign: 'center',
        borderBottom: '3px solid darkgrey',
        lineHeight: '0.1em',
        margin: '25px 0 30px',
        '& span': {
            padding: '0 10px',
            backgroundColor: 'inherit'
        }
    },
    items: {
        display: 'flex', 
        justifyContent: 'space-around', 
        width: '75%', 
        flexWrap: 'wrap',
        alignItems: 'center'
    },
    item: {
        color: 'transparent',
        margin: '5px 5px',
        padding: '2px',
        transition: 'ease-in transform 0.2s', /* Animation */
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        '&:hover': {
            backgroundColor: 'rgba(128, 128, 128, 0.1)',
            borderRadius: '5px',
            color: theme.palette.primary.main,
            cursor: 'pointer',
            transform: 'scale(1.5)',
            '& > svg': {
                color: theme.palette.primary.main
            }
        },
        '& > svg': {
            color: theme.palette.primary.dark,
        }
    },
    icon: {
        color: theme.palette.primary.dark,
        '&:hover': {
            color: theme.palette.primary.main
        }
    }
}));

const Header = ({ classes }: { classes: Record<'header', string> } ) => {
  return (
    <h3 className={classes.header}>
      <span>Navigation Links</span>
    </h3>
  );
};

const NavigationLinks = ({ theme }: { theme: CustomTheme }) => {
    const { classes } = useStyles();
    return (
        <div className={classes.root}>
            <Header classes={classes} />
            <div className={classes.items}>
                <NavigationLinkItem classes={classes}>
                    <FontAwesomeIcon
                        style={{ height: '50px', width: '60px' }}
                        icon={faUsers}
                    />
                    <div>Public Rooms</div>
                </NavigationLinkItem>
                <NavigationLinkItem classes={classes}>
                    <FontAwesomeIcon
                        style={{ height: '50px', width: '60px' }}
                        icon={faCommentAlt}
                    />
                    <div>Direct Messages</div>
                </NavigationLinkItem>
                <NavigationLinkItem classes={classes}>
                    <FontAwesomeIcon
                        style={{ height: '50px', width: '60px' }}
                        icon={faGamepad}
                    />
                    <div>Battle</div>
                </NavigationLinkItem>
                <NavigationLinkItem classes={classes}>
                    <FontAwesomeIcon
                        style={{ height: '50px', width: '60px' }}
                        icon={faBookOpen}
                    />
                    <div>Teams</div>
                </NavigationLinkItem>
                <NavigationLinkItem classes={classes}>
                    <Image src={PokedexIcon} alt='Pokedex' height={60} width={70} />
                    <div>Pokedex</div>
                </NavigationLinkItem>

                {/*<Link to='/chatrooms' className='public-room-button' style={{ height: '100px', width: '100px' }}/>
                        <Button component={Link} to='/dms'>Direct Messagsdse</Button>
                        <Button variant='contained' size='large' component={Link} to='/dex'>Pokedexesdss</Button>
                        <Button variant='contained' size='large' component={Link} to='/dex'>Pokedex</Button>
                        <Button variant='contained' size='large' component={Link} to='/dex'>Pokedex</Button>
                        <Button variant='contained' size='large' component={Link} to='/dex'>Pokedex</Button>
                        <Button variant='contained' size='large' component={Link} to='/dex'>Pokedex</Button>
                        <Button variant='contained' size='large' component={Link} to='/dex'>Pokedex</Button>
                        <Button variant='contained' size='large' component={Link} to='/dex'>Pokedex</Button>*/}
            </div>
        </div>
    );
};

export default NavigationLinks;
