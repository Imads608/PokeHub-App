import { CustomTheme } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

export const useFieldStyles = () => {
    return makeStyles()((theme: CustomTheme) => ({
        root: {
            display: 'flex', 
            alignContent: 'center',
            //width: '100vh'
          },
          field: {
            width: '100%'//'41.5%',
          },
          message: {
            marginLeft: '400px',
            display: 'flex',
            alignSelf: 'center',
            position: 'absolute'
          },
          messageSuccess: {
            color: theme.palette.success.main,
          },
          messageError: {
              color: theme.palette.error.main,
          }
    }))();
}

