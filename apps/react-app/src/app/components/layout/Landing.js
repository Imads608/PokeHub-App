import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import makeStyles from '@mui/styles/makeStyles';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import auth from '../../reducers/auth';

const useStyles = makeStyles((theme) => ({
    root: {
      '& > *': {
        margin: theme.spacing(1),
      },
    },
  }));


function Landing(props) {
    const classes = useStyles();

    if (props.auth.isAuthenticated) {
        return <Redirect to='/dashboard' />
    }

    return (
        <section className="landing">
            <div className="dark-overlay">
                <div className="landing-inner">
                    <h1 className="x-large header">PokéHub</h1>
                    <p className="lead">
                        The one-stop place to show off your battling skills against other players!
                    </p>
                    <div className={classes.root}>
                        <Button variant="contained" color='primary'>
                            <Link style={{color: 'red'}} className='link' to='/register'>Sign Up</Link>
                        </Button>
                        <Button variant="contained" color='secondary'>
                            <Link className='link' style={{color: 'navy'}} to='/login'>Login</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )

}

Landing.propTypes = {
    auth: PropTypes.object.isRequired
}

const mapStateToProps = (state) => ({
    auth: state.auth
})


export default connect(mapStateToProps)(Landing);