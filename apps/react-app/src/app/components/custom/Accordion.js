import React from 'react';
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import { withStyles } from '@material-ui/core/styles';

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