import React from 'react';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import withStyles from '@mui/styles/withStyles';

export const Accordion = withStyles({
    root: {
        boxShadow: 'none',
        '&$expanded': {
            margin: 0,
        },
    },
    expanded: {},   
})(MuiAccordion);

export const AccordionSummary = withStyles({
    root: {
      '&$expanded': {
        margin: 0,
      },
    },
    content: {
      '&$expanded': {
        margin: '0 0',
      },
    },
    expanded: {},
})(MuiAccordionSummary);