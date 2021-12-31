import ThumbUpAlt from "@mui/icons-material/ThumbUpAlt"
import { Alert, Button } from "@mui/material"
import Link from "next/link"
import styles from './notification.module.scss';

const SuccessAuthNotification = ({ successText }: { successText: string }) => {
    const defaultText = 'Success!'
    return (
        <div className={styles['content']}>
            <ThumbUpAlt
                fontSize="large"
                style={{ width: '80px', height: '80px' }}
                color='primary'
            />
            <Alert style={{ margin: '15px' }}>
                {successText ? successText : defaultText}
            </Alert>
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

export default SuccessAuthNotification;