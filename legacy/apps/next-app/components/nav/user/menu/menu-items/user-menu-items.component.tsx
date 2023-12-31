import { Badge, ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import Link from 'next/link';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import { IUserData } from "@pokehub/user/interfaces";
import { ClassNameMap } from "@mui/styles";

interface UserMenuItemsProps {
    user: IUserData;
    classes: ClassNameMap<string>;
    logoutUser: () => void;
    toggleMenu: (desiredMenu: 'main-menu' | 'status-menu') => void;
}

const UserMenuItems = ({ user, classes, logoutUser, toggleMenu }: UserMenuItemsProps) => {
    console.log('Toggle Menu is:', toggleMenu);

    return (
        <>
            <MenuItem onClick={() => toggleMenu('status-menu')}>
                <ListItemIcon style={{ minWidth: '30px' }}>
                    <Badge
                    variant="dot"
                    overlap="circular"
                    classes={{ badge: classes.badge }}
                    style={{ marginLeft: '8px' }}
                    />
                </ListItemIcon>
                <ListItemText primary="Status" />
            </MenuItem>
            <MenuItem onClick={() => logoutUser()}>
                <ListItemIcon style={{ minWidth: '30px' }}>
                    <ExitToAppIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Logout" />
            </MenuItem>
            <MenuItem>
                <ListItemIcon style={{ minWidth: '30px' }}>
                    <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Preferences" />
            </MenuItem>
            <Link href={`/users/${user.uid}`} passHref>
                <MenuItem>
                    <ListItemIcon style={{ minWidth: '30px' }}>
                    <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Profile" />
                </MenuItem>
            </Link>
        </>
    )
}

export default UserMenuItems;