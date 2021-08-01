import React, { useEffect, useState } from 'react';
import { Avatar, Divider, Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { UserPropTypes } from '../../types/user';
import TrainerCardHeaderLeft from '../../img/TrainerCardHeaderLeft.png';
import TrainerCardHeaderRight from '../../img/TrainerCardHeaderRight.png';
import TrainerCardImage from '../../img/default-card_background_opaque.png';
import './dashboard.css';

const useStyles = makeStyles({
    trainerCard: {
        height: '310px',
        width: '700px',
        padding: '5px',
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'wrap',
        position: 'relative',
        backgroundImage: `url(${TrainerCardImage})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    }
});

const TrainerCard = ({ user, drawerToggle }) => {
    const classes = useStyles();
    
    return (
        <Paper className={classes.trainerCard} elevation={4}>
            <div className='trainer-card-header'>
                <img style={{ height: '30px', width: '20px', marginRight: '5px' }} src={TrainerCardHeaderLeft} />
                <span className='theme-text'>TRAINER CARD</span>
                <img style={{ height: '30px', width: '20px', marginLeft: '5px' }} src={TrainerCardHeaderRight} />
            </div>
            <div className='trainer-card-user'>
                <Avatar className='trainer-card-avatar' src='/broken-image.jpg' />
                <h4 style={{ marginBottom: 0 }} className='theme-text'>ID</h4>
                <Divider variant='fullWidth' />
                <h3 className='theme-text' style={{ overflowWrap: 'break-word', marginBottom: 0 }} >{user.uid}</h3>
                <h4 style={{ marginBottom: 0 }} className='theme-text'>USERNAME</h4>
                <Divider variant='fullWidth' />
                <h3 style={{ marginBottom: 0 }} className='theme-text'>{user.username}</h3>
            </div>
            <div className='trainer-card-content'>
                <h3 className='theme-text'>ABOUT</h3>
                <h3 className='theme-text'>FRIENDS</h3>
                <h3 className='theme-text'>ACTIVE ROOMS</h3>
                <h3 className='theme-text'>TEAMS</h3>
            </div>

        </Paper>
    )
}

TrainerCard.propTypes = {
    user: UserPropTypes.isRequired
}

export default TrainerCard;