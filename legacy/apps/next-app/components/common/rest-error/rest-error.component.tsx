import SentimentVeryDissatisfied from '@mui/icons-material/SentimentVeryDissatisfied';
import Link from 'next/link';
import { Button } from '@mui/material';
import { usePageStyles } from '../../../hooks/styles/common/page.styles';

interface RestErrorProps {
    message?: string
}

const RestError = ({ message }: RestErrorProps) => {
    const { classes } = usePageStyles();
    const defaultMessage = message ? message : 'Uh Oh. Looks Like Something Went Wrong.';

    return (
        <div className={classes.root}>
            <SentimentVeryDissatisfied
                fontSize="large"
                style={{ width: '80px', height: '80px', color: 'grey' }}
            />
            <span style={{ color: 'grey', margin: '10px 0' }} className='theme-text'>{defaultMessage}</span>
            <Link href='/dashboard' passHref>
                <Button
                    className="theme-text"
                    variant="contained"
                    color="primary"
                >
                    Back To Dashboard
                </Button>
            </Link>
        </div>
    )
}

export default RestError;