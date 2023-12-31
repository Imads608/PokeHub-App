import { Typography } from "@mui/material";
import Link from "next/link";
import UserMenu from "../user/menu/user-menu.component";
import { IUserData } from "@pokehub/user/interfaces";
import { useSelector } from "react-redux";
import { RootState } from "apps/next-app/store/store";
import { getUser } from "apps/next-app/store/user/user.selector";
import { getIsAuthenticated } from "apps/next-app/store/auth/auth.selector";

const AuthNavigation = () => {
    const user: IUserData = useSelector<RootState, IUserData>(getUser);
    const isAuthenticated: boolean = useSelector<RootState, boolean>(
        getIsAuthenticated
    );

    return (
        <>
            {!isAuthenticated ? (
                <nav>
                    <Link href="/" passHref>
                        <Typography variant='h6' component='a'>
                            Login
                        </Typography>
                    </Link>
                    <Link href="/" passHref>
                        <Typography variant='h6' component='a'>
                            Register
                        </Typography>
                    </Link>
                </nav>
            ) : (
                <nav>
                    <UserMenu user={user} />
                </nav>
            )}
        </>
    )
}

export default AuthNavigation;