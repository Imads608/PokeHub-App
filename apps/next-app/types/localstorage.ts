import { PaletteMode } from '@mui/material';
import { IAuthTokens } from '@pokehub/auth/interfaces';

export interface Preferences {
    rememberMe?: boolean,
    theme?: PaletteMode
}


export interface LocalStorage {
    tokens?: IAuthTokens,
    preferences?: Preferences
}