import React from 'react';
import { NEW_DM } from '../../types/dm';

const WithResultsSearch = (Component, apiFetch, fetchParams, typeChild) => {
  return class extends React.Component {
    state = {
      localLoading: true,
      results: [],
      search: '',
      isDone: false,
      offset: 0,
    };

    componentDidMount() {
      this._isMounted = true;
      if (typeChild !== NEW_DM) {
        this.getResults('', 0);
      } else this.setState({ localLoading: false });
    }

    componentWillUnmount() {
      this._isMounted = false;
    }

    resetFilter = () => {
      if (typeChild !== NEW_DM) this.getResults('', 0);
    };

    searchOnNewFilter = (search) => {
      console.log('Searching', search);
      if (typeChild !== NEW_DM || (typeChild === NEW_DM && search !== ''))
        this.getResults(search, 0);
      else if (typeChild === NEW_DM)
        this.setState({
          localLoading: false,
          results: [],
          search: '',
          isDone: false,
          offset: 0,
        });
    };

    getResults = (search, providedOffset) => {
      console.log(
        `Getting results with seach ${search} and offset ${providedOffset}`
      );
      providedOffset =
        providedOffset !== undefined || providedOffset === 0
          ? providedOffset
          : this.state.offset;
      this.setState({ localLoading: providedOffset > 0 ? false : true });
      apiFetch(providedOffset, 20, search).then(
        (result) =>
          this._isMounted &&
          this.setState((currState) => ({
            results:
              providedOffset === 0 || currState.search !== search
                ? result.data
                : currState.results.concat(result.data),
            isDone: result.isDone,
            search,
            offset: currState.search !== search ? 20 : 20 + providedOffset,
            localLoading: false,
          }))
      );
    };

    render() {
      return (
        <Component
          fetched={this.state}
          searchOnNewFilter={this.searchOnNewFilter}
          resetFilter={this.resetFilter}
          getResults={this.getResults}
          {...this.props}
        />
      );
    }
  };
};

export default WithResultsSearch;
