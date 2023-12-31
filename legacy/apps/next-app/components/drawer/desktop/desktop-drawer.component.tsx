import React, { useEffect, useRef } from 'react';
import { Typography } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import { useDispatch } from 'react-redux';
import { drawer_width_updated } from 'apps/next-app/store/drawer/drawer.reducer';
import { useLocalStyles } from './desktop-drawer.styles';

const DesktopDrawer = () => {
    const drawerRef: React.MutableRefObject<HTMLElement> = useRef(null);
    const dispatch = useDispatch();
    const { classes } = useLocalStyles();

    useEffect(() => {
        dispatch(drawer_width_updated(drawerRef.current.offsetWidth));
    }, [drawerRef.current?.offsetWidth]);

    return (
        <main className={classes.root} ref={drawerRef}>
            <Link href='/battle' passHref>
                <div className={classes.item}>
                    <Image src='/images/battle.png' width={70} height={70} />
                    <Typography sx={{ display: 'flex', alignItems: 'center', position: 'fixed', top: '32%', right: '90px' }} variant='body2' component='div'>
                            <span>Battle</span><span>{'>'}</span>
                    </Typography>
                </div>
            </Link>
            <Link href='/teams' passHref>
                <div className={classes.item}>
                    <Image src='/images/teams.png' width={70} height={70}/>
                    <Typography sx={{ position: 'fixed', top: '32%', right: '90px' }} variant='body2' component='div'>
                            <span>Teams</span><span>{' >'}</span>
                    </Typography>
                </div>
            </Link>
            <Link href='/dex' passHref>
                <div className={classes.item}>
                    <Image src='/images/pokedex.png' width={70} height={70} />
                    <Typography sx={{ position: 'fixed', top: '32%', right: '90px' }} variant='body2' component='div'>
                            <span>Pokédex</span><span>{' >'}</span>
                    </Typography>
                </div>
            </Link>
            <Link href='/chatrooms' passHref>
                <div className={classes.item}>
                    <Image src='/images/chatroom.png' width={70} height={70} />
                    <Typography sx={{ position: 'fixed', top: '32%', right: '90px' }} variant='body2' component='div'>
                            <span>Chatrooms</span><span>{' >'}</span>
                    </Typography>
                </div>
            </Link>
            <Link href='/dms' passHref>
                <div className={classes.item}>
                    <Image src='/images/dm.png' width={70} height={70} />
                    <Typography sx={{ position: 'fixed', top: '32%', right: '90px' }} variant='body2' component='div'>
                            <span>DMs</span><span>{' >'}</span>
                    </Typography>
                </div>
            </Link>
        </main>
    );
};

export default DesktopDrawer;
