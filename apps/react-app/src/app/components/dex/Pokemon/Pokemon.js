import { Chip, Grid, IconButton, Paper } from '@material-ui/core';
import { ArrowBackIos } from '@material-ui/icons';
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { getPokedexEntryData, getPokedexSpeciesEntryData } from '../../../api/dex';
import SpeciesInfo from './SpeciesInfo';
import Header from './Header';
import PropTypes from 'prop-types';
import Loading from '../../layout/Loading';
import Type from '../common/Type';

const Pokemon = ({ dexEntry, location }) => {
    const dexNum = location.pathname.split('/')[3];
    const { data, error, isLoading } = useQuery(['pokemon', dexNum], () => getPokedexEntryData(dexNum), { enabled: dexEntry || dexNum === undefined ? false : true});
    const { data: speciesData, error: speciesError, isLoading: speciesLoading } = useQuery(['pokemon-species', dexNum], () => getPokedexSpeciesEntryData(dexNum));

    const pokemonData = dexEntry ? dexEntry : data;

    return (
        (!dexEntry && isLoading) || (!speciesData && speciesLoading) ? <Loading /> :
        <main>
            <Header pokemonData={pokemonData} />
            <section style={{ display: 'flex' }}>
                <SpeciesInfo speciesData={speciesData} dexEntryData={pokemonData} />
                <Grid container spacing={3}>
                    <Grid item xs={6} md={5}>
                        <Paper style={{ backgroundColor: '#A7DB8D', width: '100%', padding: '5px' }} elevation={1}>
                            <div style={{ dislay: 'flex', flexDirection: 'row', marginBottom: '5px' }}>
                                <div className='theme-text'>
                                    Abilities
                                </div>
                                <div style={{ backgroundColor: 'white', borderRadius: '5px', padding: '5px', display: 'flex', justifyContent: 'space-around' }}>
                                    { pokemonData.abilities.map((abilityObj, index) => (
                                        <Chip classes={{ label: 'theme-text-whitebkg' }} style={{ marginRight: '3px', marginBottom: '3px' }} key={index} label={abilityObj.ability.name} variant='outlined' color='secondary'/>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className='theme-text'>
                                    Types
                                </div>
                                <div style={{ backgroundColor: 'white', borderRadius: '5px', padding: '5px', display: 'flex', justifyContent: 'space-around' }}>
                                    { pokemonData.types.map((typeObj, index) => (
                                        <Type key={index} pokemonType={typeObj.type.name} />    
                                    ))}
                                </div>
                            </div>
                        </Paper>
                    </Grid>
                </Grid>
            </section>
        </main>
    )
    /*
    return (
        !dexEntry && isLoading ? <Loading /> : 
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <section style={{ display: 'flex', justifyContent: 'start', alignItems: 'center' }}>
                <IconButton
                    color="inherit"
                    component={Link}
                    to='/dex/pokemon'
                    aria-label="open drawer"
                    edge="end"
                    style={{ marginRight: '5px' }}
                >
                    <ArrowBackIos fontSize='small' />
                </IconButton>
                <div className='theme-text-whitebkg' style={{ display: 'flex', justifyContent: 'center', width: '100%', fontSize: 'large', alignItems: 'center' }}>
                    { pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1) }
                    <span style={{ color: 'grey', fontSize: 'medium', marginLeft: '10px'}}># {pokemonData.id}</span>
                </div>
            </section>
            <Grid container spacing={2} style={{ marginTop: '20px', marginLeft: '10px', height:'100%' }}>
                <Grid item xs={3}>
                    <img style={{ maxHeight: '200px' }} src="https://cdn2.bulbagarden.net/upload/2/21/001Bulbasaur.png" alt={pokemonData.name} />
                </Grid>
                <Grid item xs={3}>
                    <Paper style={{ backgroundColor: '#A7DB8D', height: '100%', width: '100%' }} elevation={2}>
                        Abilities
                    </Paper>
                </Grid>
            </Grid>
        </div>
    )*/
}

Pokemon.propTypes = {
    dexEntry: PropTypes.object,
    location: PropTypes.object.isRequired
}

export default Pokemon;