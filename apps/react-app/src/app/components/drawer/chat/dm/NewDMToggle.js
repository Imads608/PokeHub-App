import React from 'react';
import { ListItemText, ListItem, Hidden } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const NewDMToggle = ({ toggleNewDM, startNewDM, location}) => {
    return (
        <div>
            <Hidden mdDown>
                <ListItem        
                    button
                    onClick={startNewDM}
                    disabled={false/*location.pathname.includes("/dms")*/}
                    selected={toggleNewDM}
                    className='drawer-expanded-list-item'
                >
                    { toggleNewDM ? <ArrowForwardIosIcon fontSize='small' /> : <ArrowBackIosIcon fontSize='small' /> }
                    <ListItemText
                        primary={
                            <h5 className={`drawer-header-text drawer-expanded-list-item-text ${toggleNewDM ? 'drawer-header-expanded' : 'drawer-header'}`}
                            >Start a New DM
                            </h5>
                        } 
                    />
                </ListItem>
            </Hidden>
            <Hidden mdUp>
                <ListItem
                    button
                    component={Link}
                    to='/dms'
                    selected={location.pathname === '/dms'}
                    className='drawer-expanded-list-item'
                >
                    <AddCircleIcon fontSize='small' style={{ color: 'grey' }}/>
                    <ListItemText
                        primary={
                            <h5 className={`drawer-header-text drawer-expanded-list-item-text ${toggleNewDM ? 'drawer-header-expanded' : 'drawer-header'}`}
                            >Start a New DM
                            </h5>
                        } 
                    />
                </ListItem>
            </Hidden>
        </div>
    );
}

NewDMToggle.propTypes = {
    toggleNewDM: PropTypes.bool.isRequired,
    startNewDM: PropTypes.func.isRequired,
    location: PropTypes.object.isRequired
}

export default NewDMToggle;