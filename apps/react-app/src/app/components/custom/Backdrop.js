import { withStyles } from '@material-ui/core';
import MuiBackdrop from '@material-ui/core/Backdrop';

export default withStyles({
    root: {
        color: 'grey',
        backgroundColor: 'grey',
        width: '100%',
        height: '100vh'
    }
})(MuiBackdrop);