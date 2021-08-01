import { Chip, Grid, Hidden, ListItem } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import useLoadPokedexEntries from '../../hooks/useLoadPokedexEntries';
import useInfiniteLoad from '../../hooks/useInfiniteLoad';
import './dex.css';
import { Link } from 'react-router-dom';

const DexEntries = ({ bottomReached, setSelectedEntry }) => {
    const { data, error, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, status, isLoading, setBottomReached } = useInfiniteLoad('DexEntries');

    useEffect(() => {
        setBottomReached(bottomReached);
    }, [ bottomReached ])

    const getHeight = (dexNum) => {
        const row_index = Math.floor((dexNum)/12);
        return row_index * -30;
    }

    const getWidth = (dexNum) => {
        const remainder = (dexNum) % 12; 
        return remainder * -40;
    }

    return (
        status === 'loading' ? (
            <main>
                Loading
            </main>
        ) : (
                <Grid container spacing={3} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    {data.map((dexEntry, i) => (
                        <ListItem component={Link} button to={`/dex/pokemon/${dexEntry.id}`} onClick={() => setSelectedEntry({ type: 'pokemon', entry: dexEntry })} className={`results-row ${ i % 2 !== 0 ? 'odd-results-row' : ''}`} key={i}>
                                <Grid item xs={1} md={1}>
                                    <div className='theme-text-whitebkg'>
                                        # {dexEntry.id}
                                    </div>
                                </Grid>
                                <Grid item xs={4} md={2}>
                                    <div
                                        className='overworld-sprite'
                                        style={{ background: `transparent url(https://play.pokemonshowdown.com/sprites/pokemonicons-sheet.png?v5) no-repeat scroll ${getWidth(dexEntry.id)}px ${getHeight(dexEntry.id)}px` }}
                                    >
                                    </div>
                                    <div className='theme-text-whitebkg'>
                                        { dexEntry.name.toUpperCase() }
                                    </div>
                                </Grid>
                                <Grid item xs={3} md={3}>
                                    { dexEntry.types.map((typeObj, index) => (
                                        <img key={index} style={{ height: '15px', marginRight: '5px' }} src={`https://play.pokemonshowdown.com/sprites/types/${typeObj.type.name[0].toUpperCase() + typeObj.type.name.slice(1)}.png`} alt={typeObj.type.name} />
                                    )) }
                                </Grid>
                                <Grid item xs={5} md={4}>
                                    { dexEntry.abilities.map((abilityObj, index) => (
                                        <Chip classes={{ label: 'theme-text-whitebkg' }} style={{ marginRight: '3px', marginBottom: '3px' }} key={index} label={abilityObj.ability.name} variant='outlined' color='secondary'/>
                                    ))}
                                </Grid>
                                <Hidden smDown>
                                    <Grid container item md={6} xs={false}>
                                        {["HP", "Attack", "Defense", "SpAtt", "SpDef", "Speed"].map((statObj, index) => (
                                            <Grid key={index} item xs={false} md={2}>
                                                <span className='theme-text-whitebkg'>{statObj}</span>
                                            </Grid>
                                        ))}
                                        { dexEntry.stats.map((statObj, index) => (
                                            <Grid key={index} item md={2}>
                                                <span>{statObj.base_stat}</span>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Hidden>
                        </ListItem>    
                    ))}
                    <div className='font-theme' style={{ marginLeft: '10px', fontStyle: 'large'}}>({ hasNextPage && bottomReached? 'Fetching...' : 'No more data to Load!'}</div> 
                </Grid>
            
            /*<main style={{ display: 'flex', flexDirection: 'column', overflow: 'auto', marginTop: '5px' }}>
                <div>
                   {data.pages.map((page, i) => (
                       <div key={i}>
                           {page.results.map((dexEntry, i) => (
                               <ListItem button className={`results-row ${ i % 2 !== 0 ? 'odd-results-row' : ''}`} key={i}>
                                    <div 
                                        className='overworld-sprite'
                                        style={{ background: `transparent url(https://play.pokemonshowdown.com/sprites/pokemonicons-sheet.png?v5) no-repeat scroll ${getWidth(dexEntry.id)}px ${getHeight(dexEntry.id)}px` }}>
                                    </div>
                                    <div className='theme-text-whitebkg'>
                                        { dexEntry.name.toUpperCase() }
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-around'}}>
                                        { dexEntry.types.map(type => (
                                            <img src={`https://play.pokemonshowdown.com/sprites/types/Grass.png`} alt="Grass" />
                                        )) }
                                    </div>
                               </ListItem>
                           ))}
                       </div>
                   ))}
                </div>
                <div>
                    <button
                    onClick={() => fetchNextPage()}
                    disabled={!hasNextPage || isFetchingNextPage}
                    >
                    {isFetchingNextPage
                        ? 'Loading more...'
                        : hasNextPage
                        ? 'Load More'
                        : 'Nothing more to load'}
                    </button>
                </div>
                <div>{isFetching && !isFetchingNextPage ? 'Fetching...' : null}</div> 
            </main>*/
        )
    )

}

export default DexEntries;