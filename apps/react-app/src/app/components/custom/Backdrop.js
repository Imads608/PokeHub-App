import withStyles from '@mui/styles/withStyles';
import MuiBackdrop from '@mui/material/Backdrop';

export default withStyles({
    root: {
        color: 'grey',
        backgroundColor: 'grey',
        width: '100%',
        height: '100vh'
    }
})(MuiBackdrop);