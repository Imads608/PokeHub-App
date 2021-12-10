import React from 'react';
import './dashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Button } from '@mui/material';
import UsefulLinkItem from './UsefulLinkItem';

const Header = () => {
    return (
        <h3 className='useful-links-header'>
            <span>Useful Links</span>
        </h3>
    )
}

const UsefulLinks = () => {
    return (
        <div className='useful-links-list'>
            <Header />
            <div style={{ display: 'flex', justifyContent: 'space-around', width: '75%', flexWrap: 'wrap' }}>
                <UsefulLinkItem>
                    <FontAwesomeIcon style={{ height: '50px', width: '60px', color: 'rgb(230,32,180)' }} icon={faUsers} />
                    <div>Public Rooms</div>
                </UsefulLinkItem>

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
    )
}

export default UsefulLinks;