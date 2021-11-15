import { Button, ListItem, ListItemText } from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';
import '../dex.css';

const Type = ({ pokemonType }) => {
    return (
        <Button
            component={Link} to='/dex'
            className={`type-${pokemonType}`}
            style={{paddingBottom: 0, paddingTop: 0, color: 'white' }}
        >
            { pokemonType }
        </Button>
    )
}

export default Type;