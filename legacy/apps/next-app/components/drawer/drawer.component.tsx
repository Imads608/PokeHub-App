import { useAppLayout } from "apps/next-app/hooks/common/app-layout.hook";
import { CustomTheme, useTheme, createTheme, ThemeProvider } from '@mui/material/styles';
import { useSelector } from "react-redux";
import { RootState } from "apps/next-app/store/store";
import { PaletteMode } from "@mui/material";
import { getPaletteTheme } from "apps/next-app/store/app/app.selector";
import { getDrawerDesignTokens } from "apps/next-app/styles/mui/themes/drawer.theme";
import { useMemo } from "react";
import DesktopDrawer from "./desktop/desktop-drawer.component";
import MobileDrawer from "./mobile/mobile-drawer.component";

interface DrawerProps {
    drawerRef: React.MutableRefObject<HTMLDivElement>;
}

const Drawer = ({ drawerRef }: DrawerProps) => {
    const layoutType = useAppLayout();
    const outerTheme = useTheme();
    const mode = useSelector<RootState, PaletteMode>(getPaletteTheme);
    const drawerTheme: CustomTheme = useMemo((): CustomTheme => { 
        const theme = createTheme(getDrawerDesignTokens(mode, outerTheme));
        theme.typography.body2 = {
            ...theme.typography.body2,
            
        };
        return theme;
    }, [mode]);

    console.log('Drawer Mode:', mode);
    return (
        <ThemeProvider theme={drawerTheme}>
            { layoutType === "Desktop" ? <DesktopDrawer /> : <MobileDrawer drawerRef={drawerRef} />}
        </ThemeProvider>
    )
}

export default Drawer;