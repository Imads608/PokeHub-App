import React from 'react';
import Backdrop from '../custom/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';

const Loading = () => {
    return (
        <Backdrop open={true}>
            <CircularProgress className='loading' color="secondary" />
        </Backdrop>
    )
}

export default Loading;