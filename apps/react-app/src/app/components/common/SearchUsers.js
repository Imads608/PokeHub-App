import { InputBase, Paper, Switch } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const useStyles = makeStyles((theme) => ({
    searchPaper: {
        padding: "2px 4px",
        display: "flex",
        alignItems: "center",
        width: '60%',
        height: 40,
        marginLeft: '10px',
        marginTop: '5px',
        backgroundColor: 'rgb(245, 212, 212)'
      },
      input: {
        marginLeft: theme.spacing(1),
        flex: 1,
      }
}));

const SearchUsers = ({ runOnSearch }) => {
    const classes = useStyles();
    const [ inputSearch, setInputSearch ] = useState({
        search: '',
        typingTimeout: 0
    });
    const [toggleFriends, setToggleFriends] = useState(false);

    const onSearchChange = (e) => {
        if (inputSearch.typingTimeout) {
            clearTimeout(inputSearch.typingTimeout);
          }
          setInputSearch({
              search: e.target.value,
              typingTimeout: setTimeout(() => {
                runOnSearch(e.target.value);
              }, 500)
          })
    }

    return (
        <div className='newDM-search-row'>
            <Paper 
                elevation={0} 
                component="form"
                onSubmit={() => console.log('Need to implement')} 
                className={classes.searchPaper}>
                <InputBase
                    className={classes.input}
                    placeholder={`${toggleFriends ? 'Search Friends' : 'Search Users'}`}
                    value={inputSearch.search}
                    onChange={onSearchChange}
                    inputProps={{ "aria-label": "search members" }}
                />
            </Paper>
            <Switch
                checked={toggleFriends}
                onChange={() => setToggleFriends(!toggleFriends)}
                name="checkedA"
                inputProps={{ 'aria-label': 'secondary checkbox' }}
            />
        </div>
    )
};

SearchUsers.propTypes = {
    runOnSearch: PropTypes.func.isRequired
}

export default SearchUsers;