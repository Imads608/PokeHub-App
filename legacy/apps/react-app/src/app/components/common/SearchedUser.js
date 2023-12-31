import React from 'react';
import { ListItem } from '@mui/material';
import { Hidden } from '@mui/material';
import { Link } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import PropTypes from 'prop-types';
import '../drawer/drawer.css';
import { PublicUserPropTypes } from '../../types/user';
import { withRouter } from 'react-router-dom';

const getHighlightedText = (text, highlight) => {
  // Split on highlight term and include term into parts, ignore case
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {' '}
      {parts.map((part, i) => (
        <span
          key={i}
          style={
            part.toLowerCase() === highlight.toLowerCase()
              ? { backgroundColor: 'pink' }
              : {}
          }
        >
          {part}
        </span>
      ))}{' '}
    </span>
  );
};

const SearchedUser = ({ searchedUser, loadDM, location, searchTerm }) => {
  return (
    <div>
      <Hidden mdDown>
        {location.pathname.includes('/dms') ? (
          <ListItem
            button
            onClick={() => loadDM(searchedUser, true)}
            className="search-result"
          >
            <Avatar className="search-result-avatar" src="/broken-image.jpg" />
            <span className="lead">
              {getHighlightedText(searchedUser.username, searchTerm)}
            </span>
          </ListItem>
        ) : (
          <ListItem
            button
            onClick={() => loadDM(searchedUser, false)}
            className="search-result"
          >
            <Avatar className="search-result-avatar" src="/broken-image.jpg" />
            <span className="lead">
              {getHighlightedText(searchedUser.username, searchTerm)}
            </span>
          </ListItem>
        )}
      </Hidden>
      <Hidden mdUp>
        <ListItem
          button
          onClick={() => loadDM(searchedUser, true)}
          className="search-result"
        >
          <Avatar className="search-result-avatar" src="/broken-image.jpg" />
          <span className="lead">
            {getHighlightedText(searchedUser.username, searchTerm)}
          </span>
        </ListItem>
      </Hidden>
    </div>
  );
};

SearchedUser.propTypes = {
  searchedUser: PublicUserPropTypes.isRequired,
  loadDM: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
};

export default withRouter(SearchedUser);
