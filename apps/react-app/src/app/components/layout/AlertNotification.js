import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Alert, AlertTitle } from '@material-ui/lab';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Fade from '@material-ui/core/Fade';
import Box from '@material-ui/core/Box';
import { getAppLoading } from '../../selectors/app';
import { getAppNotification } from '../../selectors/notification';
import { resetNotification } from '../../actions/notification';

const styles = (theme) => ({
    root: {
      width: '100%',
      '& > * + *': {
        marginTop: theme.spacing(2),
      },
    },
  });


class AlertNotification extends React.Component {

    state = {
        isOpen: false
    }

    componentDidMount = () => {
        if (this.props.notification.message) {
            this.setState({isOpen: true});
        } else {
            this.setState({ isOpen: false});
        }
    }

    componentDidUpdate = (prevProps, prevState) => {
        if (prevProps.notification.message != this.props.notification.message) {
            this.setState({ isOpen: true });
        }
    }

    closeNotification = () => {
        this.setState({ isOpen: false });
        this.props.resetNotification();
    }

    render() {
        const { loading, notification } = this.props;
        console.log('Notification', notification);
        return (
            !loading && notification.message && notification.component === 'AlertNotification' ? (
                <Fade in={this.state.isOpen}>
                    <Box zIndex="modal" position='absolute' left='25%' width='50%'>
                        <Alert onClose={() => this.closeNotification()} severity={notification.type.toLowerCase()}>
                            {notification.message}
                        </Alert>
                    </Box>
                </Fade>
            ) : ''
        )
    }
}

AlertNotification.propTypes = {
    notification: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired
}

const mapStateToProps = (state) => ({
    notification: getAppNotification(state),
    loading: getAppLoading(state)
})

export default connect(mapStateToProps, { resetNotification })(withStyles(styles)(AlertNotification));