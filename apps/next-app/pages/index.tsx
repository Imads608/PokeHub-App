import styles from '../styles/index.module.scss';
import Button from '@mui/material/Button';
import makeStyles from '@mui/styles/makeStyles';
import { connect } from 'react-redux';
import Link from 'next/link';
import { Theme } from '@mui/material/styles';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
}));

export function Index() {
  const classes = useStyles();
  /*
   * Replace the elements below with your own.
   *
   * Note: The corresponding styles are in the ./index.css file.
   */
  return (
    <section style={{ height: '93vh' }} className={styles.landing}>
      <div className={styles['dark-overlay']}>
        <div className={styles['landing-inner']}>
          <h1 className={`${styles['x-large']} ${styles.header}`}>PokéHub</h1>
          <p className={styles.lead}>
            The one-stop place to show off your battling skills against other
            players!
          </p>
          <div className={classes.root}>
            <Button variant="contained" color="primary">
              <Link href="/register">
                <a style={{ color: 'red' }} className="link">
                  Sign Up
                </a>
              </Link>
            </Button>
            <Button variant="contained" color="secondary">
              <Link href="/login">
                <a style={{ color: 'navy' }} className="link">
                  Login
                </a>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Index;
