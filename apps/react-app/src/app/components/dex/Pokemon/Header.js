import { Grid, IconButton } from '@material-ui/core';
import { ArrowBackIos } from '@material-ui/icons';
import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ pokemonData }) => {
    return (
        <Grid container spacing={2} style={{ display: 'flex' }}>
            <Grid item xs={5}>
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
            </Grid>
            <Grid item xs={2}>
                <div className='theme-text-whitebkg' style={{ display: 'flex', justifyContent: 'center', width: '100%', fontSize: 'large', alignItems: 'center' }}>
                    { pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1) }
                    <span style={{ color: 'grey', fontSize: 'medium', marginLeft: '10px'}}># {pokemonData.id}</span>
                </div>
            </Grid>
        </Grid>
    )
}

export default Header;