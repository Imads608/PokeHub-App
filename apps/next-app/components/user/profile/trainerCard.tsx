
import { Avatar, Divider, ListItemButton, Paper } from '@mui/material';
import TrainerCardHeaderLeft from '../../../public/images/TrainerCardHeaderLeft.png';
import TrainerCardHeaderRight from '../../../public/images/TrainerCardHeaderRight.png';
import { IUserPublicProfile } from '@pokehub/user/interfaces';
import Image from 'next/image';
import Link from 'next/link';
import { useTrainerCardStyles } from '../../../hooks/styles/user/useTrainerCardStyles';

interface TrainerCardProps {
    userProfile: IUserPublicProfile
};

const TrainerCard = ({ userProfile }: TrainerCardProps) => {
    const { classes } = useTrainerCardStyles();

    return (
        <>
            <Paper className={classes.root} elevation={4}>
                <div className={classes.header}>
                    <span style={{ marginRight: '5px', display: 'flex', alignItems: 'center' }}>
                        <Image height={30} width={20} src={TrainerCardHeaderLeft} alt='Trainer Card Header Left' />
                    </span>
                    <span>TRAINER CARD</span>
                    <span style={{ marginLeft: '5px', display: 'flex', alignItems: 'center' }}>
                        <Image height={30} width={20} src={TrainerCardHeaderRight} alt='Trainer Card Header Right' />
                    </span>
                </div>
                <div className={classes.body}>
                    <Avatar className={classes.avatar} src={userProfile.user.avatarUrl ? userProfile.user.avatarUrl : '#'} alt={userProfile.user.username} />
                    <h4 style={{ marginBottom: 0 }}>
                        USERNAME
                    </h4>
                    <Divider variant="fullWidth" />
                    <h3 style={{ marginBottom: 0 }}>
                        {userProfile.user.username}
                    </h3>
                </div>
                <div className={classes.content}>
                    <Link href='#About' passHref>
                        <ListItemButton className={classes.link}>ABOUT</ListItemButton>
                    </Link>
                    <Link href='#BattleStats' passHref>
                        <ListItemButton className={classes.link}>BATTLE STATS</ListItemButton>
                    </Link>
                    <Link href='#Friends' passHref>
                        <ListItemButton className={classes.link}>FRIENDS</ListItemButton>
                    </Link>
                    <Link href='#ActiveRooms' passHref>
                        <ListItemButton className={classes.link}>ACTIVE ROOMS</ListItemButton>
                    </Link>
                    <Link href='#Teams' passHref>
                        <ListItemButton className={classes.link}>TEAMS</ListItemButton>
                    </Link>
                </div>
            </Paper>
        </>
    );
  };
export default TrainerCard;