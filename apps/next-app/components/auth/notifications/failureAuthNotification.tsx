import SentimentVeryDissatisfied from '@mui/icons-material/SentimentVeryDissatisfied';
import { Button } from '@mui/material';
import Link from 'next/link';
import styles from './notification.module.scss';

const FailureAuthNotification = ({ failureText }: { failureText: string }) => {
    const defaultText = 'Uh Oh. Looks Like something went wrong.'
    
    return (
        <div className={styles['content']}>
            <SentimentVeryDissatisfied
                fontSize="large"
                style={{ width: '80px', height: '80px', color: 'grey' }}
            />
            <span style={{ color: 'grey', margin: '10px 0' }} className='theme-text'>{failureText === '' ? defaultText : failureText}</span>
            <Link href='/login' passHref>
                <Button
                    className="theme-text"
                    variant="contained"
                    color="primary"
                >
                    Back To Login
                </Button>
            </Link>
        </div>
    )
}

export default FailureAuthNotification;