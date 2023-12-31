import { CustomTheme } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

export const useNavStyles = () => {
    return makeStyles()((theme: CustomTheme) => ({
        root: {
            position: 'sticky',
          },
          title: {
            margin: '0 10px',
            textDecoration: 'none'
          },
          toolBar: {
            height: '7vh',
            '& nav': {
                display: 'flex',
                flexWrap: 'wrap'
            }
          },
          appBar: {
            backgroundColor: theme.palette.primary.main,
          },
          link: { 
            margin: '0 10px',
            color: 'inherit',
            textDecoration: 'none'
          }
    }))();
};
