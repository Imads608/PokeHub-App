import { Fade } from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';

const NavItem = ({ itemName, selectedItem, handleChange, itemIcon}) => {

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    return (
        <div className={`dex-nav-item ${itemName === selectedItem ? 'dex-nav-item-selected' : ''}`} onClick={(e) => handleChange(e, itemName)}>
            <img style={{ height: '35px' }} src={itemIcon} />
            <Fade in={selectedItem === itemName}>
                <div className='theme-text'>
                    { capitalizeFirstLetter(itemName) }
                </div>
            </Fade>
        </div>
    )
}

NavItem.propTypes = {
    itemName: PropTypes.string.isRequired,
    selectedItem: PropTypes.string.isRequired,
    handleChange: PropTypes.func.isRequired,
    itemIcon: PropTypes.string.isRequired
}

export default NavItem;