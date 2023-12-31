import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export type AppLayout = "Desktop" | "Mobile";


export const useAppLayout = (): AppLayout => {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

    return isDesktop ? "Desktop" : "Mobile";
}