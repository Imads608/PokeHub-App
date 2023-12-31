import { Typography } from "@mui/material"
import { getIsAuthenticated } from "apps/next-app/store/auth/auth.selector";
import { RootState } from "apps/next-app/store/store";
import Image from "next/image"
import Link from "next/link"
import { useSelector } from "react-redux";

interface AppLogoProps {
    classes: Record<"title", string>;
}

const AppLogo = ({ classes }: AppLogoProps) => {
    const isAuthenticated: boolean = useSelector<RootState, boolean>(getIsAuthenticated);

    return (
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Image layout="fixed" height={40} width={40} src={'/images/app-logo.svg'} alt="logo" />
            <Link href={ isAuthenticated ? '/dashboard' : '/' } passHref>
                <Typography variant='h6' component='a' className={classes.title}>
                    PokéHub
                </Typography>
            </Link>
        </div>
    )
}

export default AppLogo;