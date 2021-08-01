import React from 'react';
import { ListItem } from '@material-ui/core';
import { Hidden } from "@material-ui/core";
import { Link } from 'react-router-dom';
import Avatar from '@material-ui/core/Avatar';
import PropTypes from 'prop-types';
import '../../drawer.css';
import { PublicUserPropTypes } from '../../../../types/user';

const SearchedUser = ({ searchedUser, loadDM }) => {
    return (
        <div>
            <Hidden smDown>
                <ListItem button onClick={() => loadDM(searchedUser)} className='search-result'>
                    <Avatar className='search-result-avatar' src='/broken-image.jpg' />
                    <span className='lead'>{searchedUser.username}</span>
                </ListItem>
            </Hidden>
            <Hidden mdUp>
                <ListItem button component={Link} to={`/dms/${searchedUser.uid}`} className='search-result'>
                    <Avatar className='search-result-avatar' src='/broken-image.jpg' />
                    <span className='lead'>{searchedUser.username}</span>
                </ListItem>
            </Hidden>
        </div>
    )
}

SearchedUser.propTypes = {
    searchedUser: PublicUserPropTypes.isRequired,
    loadDM: PropTypes.func.isRequired,
}

export default SearchedUser;

