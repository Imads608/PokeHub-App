import { CircularProgress, List, Button } from '@mui/material';
import React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import InfiniteScroll from 'react-infinite-scroll-component';
import SearchedUser from './SearchedUser';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import PropTypes from 'prop-types';

const SearchUserResults = ({
  loadingDM,
  fetched: { results, localLoading, offset, search, isDone },
  fetched,
  getResults,
  loadDM,
  error,
  resetError,
}) => {
  return localLoading || loadingDM ? (
    <CircularProgress style={{ margin: 'auto' }} color="secondary" />
  ) : error ? (
    <section className="empty-search-results">
      <div style={{ fontSize: '20px' }} className="drawer-header">
        Uh Oh. Something went wrong
      </div>
      <SentimentVeryDissatisfiedIcon
        fontSize="large"
        style={{ width: '80px', height: '80px', color: 'grey' }}
      />
      <Button
        className="theme-text"
        variant="contained"
        color="secondary"
        onClick={resetError}
      >
        Go Back
      </Button>
    </section>
  ) : search === '' ? (
    <section className="empty-search-results">
      <SearchIcon
        fontSize="large"
        style={{ width: '80px', height: '80px', color: 'grey' }}
      />
      <div style={{ fontSize: '20px' }} className="drawer-header">
        Start Searching!
      </div>
    </section>
  ) : results.length === 0 && search ? (
    <section className="empty-search-results">
      <div style={{ fontSize: '20px' }} className="drawer-header">
        Nothing Found
      </div>
      <SentimentVeryDissatisfiedIcon
        fontSize="large"
        style={{ width: '80px', height: '80px', color: 'grey' }}
      />
    </section>
  ) : (
    <List id="scrollUsers" className="search-results">
      <InfiniteScroll
        dataLength={results.length}
        next={() => getResults(search, offset)}
        hasMore={!isDone}
        loader={<h4>Loading...</h4>}
        scrollableTarget="scrollUsers"
      >
        {fetched &&
          results.map((searched) => (
            <SearchedUser
              searchedUser={searched}
              key={searched.uid}
              loadDM={loadDM}
              searchTerm={search}
            />
          ))}
      </InfiniteScroll>
    </List>
  );
};

SearchUserResults.propTypes = {
  loadingDM: PropTypes.bool.isRequired,
  fetched: PropTypes.object.isRequired,
  getResults: PropTypes.func.isRequired,
  loadDM: PropTypes.func.isRequired,
  error: PropTypes.bool.isRequired,
  resetError: PropTypes.func.isRequired,
};

export default SearchUserResults;
