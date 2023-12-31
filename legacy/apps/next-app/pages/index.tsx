import styles from '../styles/index.module.scss';
import Button from '@mui/material/Button';
import makeStyles from '@mui/styles/makeStyles';
import Link from 'next/link';
import { CustomTheme } from '@mui/material';
import PageLayout from '../components/common/page-layout/page-layout.component';

const useStyles = makeStyles((theme: CustomTheme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  signupText: {
    color: theme.palette.secondary.main
  },
  loginText: {
    color: theme.palette.primary.main
  }
}));

export function Index() {
  const classes = useStyles();
  /*
   * Replace the elements below with your own.
   *
   * Note: The corresponding styles are in the ./index.css file.
   */
  return (
    <PageLayout>
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
                  <a className={`link ${classes.signupText}`}>
                    Sign Up
                  </a>
                </Link>
              </Button>
              <Button variant="contained" color="secondary">
                <Link href="/login">
                  <a className={`link ${classes.loginText}`}>
                    Login
                  </a>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

export default Index;
