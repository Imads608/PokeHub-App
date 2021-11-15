import React, { useEffect, useState } from 'react';
import useInitialLoad from '../../hooks/useInitialLoad';
import SearchIcon from '@mui/icons-material/Search';
import Loading from '../layout/Loading';
import logo from '../layout/pokehub-logo.png';
import DexEntries from './DexEntries';
import NavItem from './NavItem';
import GenNavbar from './GenNavbar'
import { Grow, InputBase, Paper, Slide } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import Pokemon from './Pokemon/Pokemon';

const useStyles = makeStyles((theme) => ({
    searchPaper: {
        padding: "2px 4px",
        display: "flex",
        alignItems: "center",
        width: '100%',
        height: 40,
        marginLeft: '10px',
        marginTop: '5px',
      },
      input: {
        marginLeft: theme.spacing(1),
        flex: 1,
      }
}));


const Pokedex = ({ location, history }) => {
    const classes = useStyles();
    const [navSelected, setNavSelected] = useState('pokemon')
    const [ bottomReached, setBottomReached ] = useState(false);
    const [inputSearch, setInputSearch] = useState('');
    const [ currentGen, setCurrentGen ] = useState('Gen 7')
    const [ selectedEntry, setSelectedEntry ] = useState({ type: '', entry: null });

    const navItems = ['pokemon', 'moves', 'abilities', 'types'];
    const generations = ['Gen 1', 'Gen 2', 'Gen 3', 'Gen 4', 'Gen 5', 'Gen 6', 'Gen 7'];

    const {data, error, isLoading} = useInitialLoad('DEX', null);

    useEffect(() => {
        location.pathname === '/dex/pokemon' && navSelected !== 'pokemon' && setNavSelected('pokemon');
        location.pathname === '/dex' && navSelected !== 'search' && setNavSelected('search');
        location.pathname === '/dex/moves' && navSelected !== 'moves' && setNavSelected('moves');
        location.pathname === '/dex/abilities' && navSelected !== 'abilities' && setNavSelected('abilities');
        location.pathname === '/dex/types' && navSelected !== 'types' && setNavSelected('types');
    }, [ location.pathname ]);

    const handleChange = (event, newValue) => {
        newValue !== 'search' ? history.push(`/dex/${newValue}`) : history.push('/dex');
        //setNavSelected(newValue);
    };

    const handleScroll = (e) => {
        const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
        if (bottom) { 
            console.log('Bottom reached');
            setBottomReached(true);
        } else {
            setBottomReached(false);
        }
    }

    const onSearchChange = (e) => {
        this.setInputSearch(e.target.value);
    }

    return (
        isLoading ? <Loading /> : (
            <div style={{ height: '93vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginTop: '20px', backgroundColor: 'lightpink', borderRadius: '5px' }}>
                    <div className='dex-search-nav-item' style={{  }} onClick={(e) => handleChange(e, 'search')}>
                        <SearchIcon fontSize='large' />
                        <Grow in={navSelected === 'search'}>
                            <Paper 
                                elevation={0} 
                                component="form"
                                onSubmit={() => console.log('Need to implement')} 
                                className={classes.searchPaper}>
                                <InputBase
                                    className={classes.input}
                                    placeholder='Search'
                                    value={inputSearch}
                                    onChange={onSearchChange}
                                    inputProps={{ "aria-label": "search members" }}
                                />
                            </Paper>
                        </Grow>
                    </div>
                    <div style={{ height: '100%', display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-evenly' }}>
                        { navItems.map((navItem, index) => (
                            <NavItem key={index} itemName={navItem} selectedItem={navSelected} handleChange={handleChange} itemIcon={logo} />
                        ))}
                    </div>
                </div>
                { navSelected !== 'search' && ( <GenNavbar generations={generations} setCurrentGen={setCurrentGen} currentGen={currentGen} /> )}
                {/*<div className='overworld'></div>*/}
                <Slide direction='right' in={location.pathname === '/dex/pokemon'} mountOnEnter unmountOnExit>
                    <div style={{ overflow: 'auto', margin: '10px' }} onScroll={handleScroll}>
                        <DexEntries bottomReached={bottomReached} setSelectedEntry={setSelectedEntry} />
                    </div>
                </Slide>
                <Slide direction='right' in={location.pathname.includes('/dex/pokemon/') && location.pathname.split('/').length >= 4} mountOnEnter unmountOnExit>
                    <div style={{  margin: '10px', overflow: 'auto' }} onScroll={handleScroll}>
                        <Pokemon dexEntry={selectedEntry.type && selectedEntry.type == 'pokemon' ? selectedEntry.entry : null} location={location} />
                    </div>
                </Slide>
            </div>
        )
    )
}


export default Pokedex;